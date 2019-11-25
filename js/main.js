const appElem = document.querySelector('.js-app');
let popupElem = null;

document.addEventListener('click', onClick);
['dragenter', 'dragleave', 'dragover', 'drop', 'change']
  .forEach(eventName => {
    appElem.addEventListener(eventName, dragNDropHandler);
    document.addEventListener(eventName, preventDefault);
  });

function onClick({target}) {
  const trigger = target.closest('[data-get-screenshot], [data-edit-image]');
  if (!trigger) return false;
  const data = trigger.dataset;
  switch (true) {
    case 'getScreenshot' in data:
      getScreenshot();
      break;
    case data.editImage === 'start':
      startEditPreview();
      break;
    case data.editImage === 'stop':
      stopEditPreview();
      break;
  }
}

function getScreenshot() {
  const screenshotTpl = appElem.querySelector('[data-screenshot-tpl]');
  html2canvas(screenshotTpl, {
    logging: false,
    imageTimeout: 0,
    onclone: ({activeElement}) => activeElement.classList.add('static')
  }).then(canvas => {
    canvas.toBlob(blob => {
      downloadScreenshot(blob);
    }, 'image/png');
  });
}

function downloadScreenshot(blob) {
  const imageUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'screenshot.png';
  link.href = imageUrl;
  link.click();
  // fallback
  const newWindow = window.open('about:blank');
  setTimeout(() => {
    const image = document.createElement('img');
    image.src = imageUrl;
    newWindow.document.body.append(image);
    newWindow.focus();
  });
}

function dragNDropHandler(e) {
  const {target, type: eventType, dataTransfer} = e;
  if (!target.closest) return false;
  const dropZone = target.closest('[data-drop-zone]');
  if (!dropZone) return false;
  switch (eventType) {
    case 'dragenter':
    case 'dragover':
      highlightDropZone(dropZone);
      break;
    case 'drop':
    case 'change':
      const file = dataTransfer ?
        dataTransfer.files[0] : target.files[0];
      if (file) createPreview(file, dropZone);
    case 'dragleave':
      unHighlightDropZone(dropZone);
  }
}

function highlightDropZone(elem) {
  elem.classList.add('active');
}

function unHighlightDropZone(elem) {
  elem.classList.remove('active');
}

function createPreview(file, dropZone) {
  if (!isImage(file)) return false;
  const reader = new FileReader();
  reader.readAsDataURL(file);
  const handler = () => {
    reader.removeEventListener('load', handler);
    const preview = document.createElement('div');
    preview.className = 'preview grid__child';
    preview.style.backgroundImage = `url('${reader.result}')`;
    dropZone.replaceWith(preview);
  };
  reader.addEventListener('load', handler);
}

function preventDefault(e) {
  e.preventDefault();
}

function isImage(file) {
  const fileTypes = getImagesTypes();
  for (let i = 0; i < fileTypes.length; i++) {
    if (file.type === fileTypes[i]) return true;
  }
  return false;
}

function getImagesTypes() {
  return [
    'image/jpeg',
    'image/pjpeg',
    'image/png'
  ];
}

function startEditPreview() {
  createPopup();
}

function stopEditPreview() {
  destroyPopup();
}

function createPopup() {
  popupElem = document.createElement('div');
  popupElem.className = 'popup';
  popupElem.innerHTML = `
    <div class="popup__inner">
      <ul class="btn-list popup__actions">
        <li class="btn-list__item">
          <button class="btn btn--blue" type="button">
            Back to original
          </button>
        </li>
        <li class="btn-list__item">
          <button class="btn btn--green" type="button" 
            data-edit-image="stop">Done</button>
        </li>
      </ul>
      <div class="popup__view">
        <canvas></canvas>
      </div>
    </div>
  `;
  document.body.append(popupElem);
}

function destroyPopup() {
  popupElem.remove();
  popupElem = null;
}