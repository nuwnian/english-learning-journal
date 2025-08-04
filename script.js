// English Learning Journal JavaScript

// Load saved data from localStorage
let savedVocab = JSON.parse(localStorage.getItem('vocabList')) || [];
let savedSentences = JSON.parse(localStorage.getItem('sentenceList')) || [];

// Debug: Check what's in localStorage
console.log('Saved vocabulary:', savedVocab);
console.log('Saved sentences:', savedSentences);

// Custom notification function
function showNotification(message, type = 'success', icon = '✓') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification-popup');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification-popup ${type}`;
    notification.innerHTML = `
        <span class="icon">${icon}</span>
        <span>${message}</span>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 400);
    }, 3000);
}

// Custom confirmation dialog function
function showConfirmDialog(title, message, icon = '⚠️') {
    return new Promise((resolve) => {
        // Remove any existing confirm dialogs
        const existingDialogs = document.querySelectorAll('.confirm-overlay');
        existingDialogs.forEach(dialog => dialog.remove());
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        
        // Create dialog
        overlay.innerHTML = `
            <div class="confirm-dialog">
                <div class="icon">${icon}</div>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="confirm-buttons">
                    <button class="confirm-btn cancel">Cancel</button>
                    <button class="confirm-btn delete">Delete</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        const cancelBtn = overlay.querySelector('.cancel');
        const deleteBtn = overlay.querySelector('.delete');
        
        cancelBtn.addEventListener('click', () => {
            hideConfirmDialog(overlay);
            resolve(false);
        });
        
        deleteBtn.addEventListener('click', () => {
            hideConfirmDialog(overlay);
            resolve(true);
        });
        
        // Add overlay click to cancel
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                hideConfirmDialog(overlay);
                resolve(false);
            }
        });
        
        // Add to page and show
        document.body.appendChild(overlay);
        setTimeout(() => {
            overlay.classList.add('show');
        }, 10);
    });
}

// Function to hide confirm dialog
function hideConfirmDialog(overlay) {
    overlay.classList.remove('show');
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.remove();
        }
    }, 300);
}

// Add interactive features to your learning journal
document.addEventListener('DOMContentLoaded', function() {
    console.log('English Learning Journal loaded!');
    
    // Load saved vocabulary and sentences on page load
    loadSavedVocab();
    loadSavedSentences();
    
    // Add Enter key support for vocabulary form
    const newWordInput = document.getElementById('newWord');
    const newDefinitionInput = document.getElementById('newDefinition');
    
    if (newWordInput && newDefinitionInput) {
        newWordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                newDefinitionInput.focus(); // Move to definition field
            }
        });
        
        newDefinitionInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addNewVocab(); // Save the word
            }
        });
    }
    
    // Add click effects to navigation links
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Smooth scrolling to sections
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Add a feature to mark vocabulary as learned
    const vocabItems = document.querySelectorAll('#vocab li');
    vocabItems.forEach(item => {
        // Remove the click event - no more learned functionality
        // Items will just be normal vocabulary items
    });

    // Add click feature for sentences to mark as favorite
    const sentenceItems = document.querySelectorAll('.sentence-list p');
    sentenceItems.forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('favorite');
        });
    });

    // Add current date to footer
    const footer = document.querySelector('footer');
    const currentDate = new Date().toLocaleDateString();
    footer.innerHTML += ` • Last updated: ${currentDate}`;
    
    // Add click listener to hide action buttons when clicking elsewhere
    document.addEventListener('click', function(e) {
        // Check if the click is outside of vocabulary or sentence items
        if (!e.target.closest('.vocab-item') && !e.target.closest('.sentence-item')) {
            // Hide all action buttons
            document.querySelectorAll('.vocab-item, .sentence-item').forEach(item => {
                item.classList.remove('show-actions');
            });
        }
    });
});

// Function to load saved vocabulary from localStorage
function loadSavedVocab() {
    const vocabList = document.querySelector('#vocab ul');
    vocabList.innerHTML = ''; // Clear existing items first
    savedVocab.forEach((vocab, index) => {
        addVocabularyToDOM(vocab.word, vocab.definition, index);
    });
}

// Function to load saved sentences from localStorage
function loadSavedSentences() {
    const sentenceList = document.querySelector('.sentence-list');
    sentenceList.innerHTML = ''; // Clear existing items first
    savedSentences.forEach((sentence, index) => {
        addSentenceToDOM(sentence.text, sentence.author, index);
    });
}

// Function to refresh vocabulary display
function refreshVocabDisplay() {
    const vocabList = document.querySelector('#vocab ul');
    vocabList.innerHTML = '';
    savedVocab.forEach((vocab, index) => {
        addVocabularyToDOM(vocab.word, vocab.definition, index);
    });
}

// Function to refresh sentences display
function refreshSentencesDisplay() {
    const sentenceList = document.querySelector('.sentence-list');
    sentenceList.innerHTML = '';
    savedSentences.forEach((sentence, index) => {
        addSentenceToDOM(sentence.text, sentence.author, index);
    });
}

// Function to add vocabulary to DOM only
function addVocabularyToDOM(word, definition, index) {
    const vocabList = document.querySelector('#vocab ul');
    const newItem = document.createElement('li');
    newItem.className = 'vocab-item';
    newItem.innerHTML = `
        <div class="item-content">
            <strong>${word}</strong> – ${definition}
        </div>
        <div class="item-actions">
            <button class="edit-btn" onclick="editVocab(${index})">📝 Edit</button>
            <button class="delete-btn" onclick="deleteVocab(${index})">🗑️ Delete</button>
        </div>
    `;
    
    // Add click event for the content area to show/hide actions
    const content = newItem.querySelector('.item-content');
    content.addEventListener('click', function() {
        // Hide actions from other items first
        document.querySelectorAll('.vocab-item').forEach(item => {
            if (item !== newItem) {
                item.classList.remove('show-actions');
            }
        });
        document.querySelectorAll('.sentence-item').forEach(item => {
            item.classList.remove('show-actions');
        });
        
        // Toggle actions for this item
        newItem.classList.toggle('show-actions');
    });
    
    vocabList.appendChild(newItem);
}

// Function to add new vocabulary word
function addVocabulary(word, definition) {
    // Save to localStorage first
    savedVocab.push({ word: word, definition: definition });
    localStorage.setItem('vocabList', JSON.stringify(savedVocab));
    
    // Refresh the entire display to ensure correct indexes
    refreshVocabDisplay();
}

// Function to handle form submission
function addNewVocab() {
    const wordInput = document.getElementById('newWord');
    const definitionInput = document.getElementById('newDefinition');
    
    const word = wordInput.value.trim();
    const definition = definitionInput.value.trim();
    
    if (word && definition) {
        addVocabulary(word, definition);
        
        // Clear the form
        wordInput.value = '';
        definitionInput.value = '';
        
        // Show custom notification
        showNotification(`Word "${word}" added successfully!`, 'success', '📖');
    } else {
        // Show error notification for empty fields
        showNotification('Please fill in both the word and definition!', 'delete', '⚠️');
    }
}

// Function to add sentence to DOM only
function addSentenceToDOM(sentence, author, index) {
    const sentenceList = document.querySelector('.sentence-list');
    const newSentence = document.createElement('div');
    newSentence.className = 'sentence-item';
    
    const sentenceText = author ? `"${sentence}" – ${author}` : `"${sentence}"`;
    newSentence.innerHTML = `
        <div class="item-content" style="font-style: italic;">
            ${sentenceText}
        </div>
        <div class="item-actions">
            <button class="edit-btn" onclick="editSentence(${index})">📝 Edit</button>
            <button class="delete-btn" onclick="deleteSentence(${index})">🗑️ Delete</button>
        </div>
    `;
    
    // Add click event for the content area to show/hide actions and mark as favorite
    const content = newSentence.querySelector('.item-content');
    content.addEventListener('click', function() {
        // Hide actions from other items first
        document.querySelectorAll('.vocab-item').forEach(item => {
            item.classList.remove('show-actions');
        });
        document.querySelectorAll('.sentence-item').forEach(item => {
            if (item !== newSentence) {
                item.classList.remove('show-actions');
            }
        });
        
        // Toggle actions for this item
        newSentence.classList.toggle('show-actions');
        
        // Also toggle favorite status
        this.classList.toggle('favorite');
        if (this.classList.contains('favorite')) {
            this.style.backgroundColor = '#D0F0A6';
            this.style.borderLeft = '3px solid #2A52BE';
        } else {
            this.style.backgroundColor = '';
            this.style.borderLeft = '';
        }
    });
    
    sentenceList.appendChild(newSentence);
}

// Function to add new sentence
function addSentence(sentence, author) {
    // Save to localStorage first
    savedSentences.push({ text: sentence, author: author });
    localStorage.setItem('sentenceList', JSON.stringify(savedSentences));
    
    // Refresh the entire display to ensure correct indexes
    refreshSentencesDisplay();
}

// Function to handle sentence form submission
function addNewSentence() {
    const sentenceInput = document.getElementById('newSentence');
    const authorInput = document.getElementById('sentenceAuthor');
    
    const sentence = sentenceInput.value.trim();
    const author = authorInput.value.trim();
    
    if (sentence) {
        addSentence(sentence, author);
        
        // Clear the form
        sentenceInput.value = '';
        authorInput.value = '';
        
        // Show custom notification
        showNotification('Sentence added to your collection!', 'success', '✍️');
    } else {
        showNotification('Please enter a sentence!', 'delete', '⚠️');
    }
}

// Edit and Delete Functions

// Function to delete vocabulary
async function deleteVocab(index) {
    const vocab = savedVocab[index];
    const confirmed = await showConfirmDialog(
        'Delete Word',
        `Are you sure you want to delete "${vocab.word}"? This action cannot be undone.`,
        '🗑️'
    );
    
    if (confirmed) {
        savedVocab.splice(index, 1);
        localStorage.setItem('vocabList', JSON.stringify(savedVocab));
        refreshVocabDisplay();
        
        // Show delete notification
        showNotification(`Word "${vocab.word}" deleted!`, 'delete', '🗑️');
    }
}

// Function to edit vocabulary
function editVocab(index) {
    const vocab = savedVocab[index];
    const newWord = prompt('Edit word:', vocab.word);
    const newDefinition = prompt('Edit definition:', vocab.definition);
    
    if (newWord && newDefinition) {
        savedVocab[index] = { word: newWord.trim(), definition: newDefinition.trim() };
        localStorage.setItem('vocabList', JSON.stringify(savedVocab));
        refreshVocabDisplay();
        
        // Show edit notification
        showNotification(`Word "${newWord}" updated!`, 'edit', '📝');
    }
}

// Function to delete sentence
async function deleteSentence(index) {
    const sentence = savedSentences[index];
    const confirmed = await showConfirmDialog(
        'Delete Sentence',
        'Are you sure you want to delete this sentence? This action cannot be undone.',
        '🗑️'
    );
    
    if (confirmed) {
        savedSentences.splice(index, 1);
        localStorage.setItem('sentenceList', JSON.stringify(savedSentences));
        refreshSentencesDisplay();
        
        // Show delete notification
        showNotification('Sentence deleted!', 'delete', '🗑️');
    }
}

// Function to edit sentence
function editSentence(index) {
    const sentence = savedSentences[index];
    const newText = prompt('Edit sentence:', sentence.text);
    const newAuthor = prompt('Edit author (optional):', sentence.author || '');
    
    if (newText) {
        savedSentences[index] = { text: newText.trim(), author: newAuthor.trim() };
        localStorage.setItem('sentenceList', JSON.stringify(savedSentences));
        refreshSentencesDisplay();
        
        // Show edit notification
        showNotification('Sentence updated!', 'edit', '📝');
    }
}

// Emergency recovery function
function recoverData() {
    console.log('Attempting data recovery...');
    const vocab = localStorage.getItem('vocabList');
    const sentences = localStorage.getItem('sentenceList');
    
    console.log('Raw vocab data:', vocab);
    console.log('Raw sentence data:', sentences);
    
    if (vocab) {
        try {
            savedVocab = JSON.parse(vocab);
            console.log('Recovered vocabulary:', savedVocab);
            refreshVocabDisplay();
        } catch (e) {
            console.error('Error parsing vocabulary data:', e);
        }
    }
    
    if (sentences) {
        try {
            savedSentences = JSON.parse(sentences);
            console.log('Recovered sentences:', savedSentences);
            refreshSentencesDisplay();
        } catch (e) {
            console.error('Error parsing sentence data:', e);
        }
    }
}

// Auto-run recovery on page load
setTimeout(recoverData, 1000);

// Example usage:
// addVocabulary('Perseverance', 'persistence in doing something despite difficulty or delay');
