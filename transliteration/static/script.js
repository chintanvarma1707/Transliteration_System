document.addEventListener('DOMContentLoaded', () => {
    const romanInput = document.getElementById('roman-input');
    const devanagariOutput = document.getElementById('devanagari-output');
    const translationOutput = document.getElementById('translation-output');
    const copyBtn = document.getElementById('copy-btn');
    const copyTransBtn = document.getElementById('copy-translation-btn');
    const clearBtn = document.getElementById('clear-btn');
    const iconCopy = document.querySelector('.icon-copy');
    const iconCheck = document.querySelector('.icon-check');
    const btnText = document.querySelector('.btn-text');
    const iconCopyTrans = document.querySelector('.icon-copy-trans');
    const iconCheckTrans = document.querySelector('.icon-check-trans');
    const btnTextTrans = document.querySelector('.btn-text-trans');

    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    const processInput = async (text) => {
        if (!text.trim()) {
            devanagariOutput.innerText = '';
            translationOutput.innerText = '';
            return;
        }

        try {
            const response = await fetch('/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text })
            });

            if (response.ok) {
                const data = await response.json();
                devanagariOutput.innerText = data.devanagari;
                translationOutput.innerText = data.translation;
            } else {
                console.error('Request failed');
                devanagariOutput.innerText = 'Error occurred.';
                translationOutput.innerText = 'Error occurred.';
            }
        } catch (error) {
            console.error('Network error:', error);
            devanagariOutput.innerText = 'Network error.';
            translationOutput.innerText = 'Network error.';
        }
    };

    const handleInputDebounced = debounce((e) => {
        processInput(e.target.value);
    }, 500);

    romanInput.addEventListener('input', handleInputDebounced);

    clearBtn.addEventListener('click', () => {
        romanInput.value = '';
        devanagariOutput.innerText = '';
        romanInput.focus();
    });

    copyBtn.addEventListener('click', async () => {
        const textToCopy = devanagariOutput.innerText;
        if (!textToCopy) return;

        try {
            await navigator.clipboard.writeText(textToCopy);

            // Visual feedback on the button
            iconCopy.classList.add('hidden');
            iconCheck.classList.remove('hidden');
            btnText.innerText = 'Copied!';
            copyBtn.classList.add('success-state');

            // Revert back after 2 seconds
            setTimeout(() => {
                iconCopy.classList.remove('hidden');
                iconCheck.classList.add('hidden');
                btnText.innerText = 'Copy';
                copyBtn.classList.remove('success-state');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy text to clipboard.');
        }
    });
});
