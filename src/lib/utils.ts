export function setupDragAndDrop(
  dropZone: HTMLElement,
  fileInput: HTMLInputElement,
  callback: (files: File[]) => void
) {
  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer?.files.length) {
          callback(Array.from(e.dataTransfer.files));
      }
  });

  fileInput.addEventListener('change', () => {
      if (fileInput.files?.length) {
          callback(Array.from(fileInput.files));
      }
  });
}
