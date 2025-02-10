export function setupDragAndDrop(
    dropZone: HTMLElement,
    fileInput: HTMLInputElement,
    callback: (file: File) => void
): void {
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
            fileInput.files = e.dataTransfer.files;
            if (fileInput.files?.[0]) callback(fileInput.files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files?.[0]) callback(fileInput.files[0]);
    });
}
