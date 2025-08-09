// English Learning Journal JavaScript

// Load saved data from localStorage
let savedVocab = JSON.parse(localStorage.getItem('vocabList')) || [];
let savedSentences = JSON.parse(localStorage.getItem('sentenceList')) || [];

// Search functionality
let searchResults = [];
let currentSearchTerm = '';

// Translation toggle state
let translationsVisible = false;

// AI Suggestions state
let aiSuggestionsEnabled = true;
let geminiApiKey = ''; // Will be set by user

// Google Gemini AI Configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

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

// Custom edit dialog function
function showEditDialog(title, currentWord, currentDefinition, icon = '📝') {
    return new Promise((resolve, reject) => {
        // Remove any existing edit dialogs
        const existingDialogs = document.querySelectorAll('.edit-overlay');
        existingDialogs.forEach(dialog => dialog.remove());
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'edit-overlay';
        overlay.innerHTML = `
            <div class="edit-dialog">
                <div class="edit-header">
                    <span class="edit-icon">${icon}</span>
                    <h3>${title}</h3>
                </div>
                <div class="edit-content">
                    <div class="edit-field">
                        <label>Word:</label>
                        <input type="text" id="editWord" value="${currentWord}" placeholder="Enter word...">
                    </div>
                    <div class="edit-field">
                        <label>Definition:</label>
                        <input type="text" id="editDefinition" value="${currentDefinition}" placeholder="Enter definition...">
                    </div>
                </div>
                <div class="edit-buttons">
                    <button class="edit-btn cancel">Cancel</button>
                    <button class="edit-btn save">Save Changes</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        overlay.querySelector('.cancel').onclick = () => {
            hideEditDialog(overlay);
            resolve(null);
        };
        
        overlay.querySelector('.save').onclick = () => {
            const newWord = document.getElementById('editWord').value.trim();
            const newDefinition = document.getElementById('editDefinition').value.trim();
            
            if (newWord && newDefinition) {
                hideEditDialog(overlay);
                resolve({ word: newWord, definition: newDefinition });
            } else {
                // Show validation error
                showNotification('Please fill in both fields!', 'error', '⚠️');
            }
        };
        
        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                hideEditDialog(overlay);
                resolve(null);
            }
        };
        
        // Handle Enter key to save
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                overlay.querySelector('.save').click();
            } else if (e.key === 'Escape') {
                overlay.querySelector('.cancel').click();
            }
        });
        
        // Add to page and show
        document.body.appendChild(overlay);
        
        // Focus on first input
        setTimeout(() => {
            document.getElementById('editWord').focus();
            document.getElementById('editWord').select();
        }, 100);
    });
}

// Function to hide edit dialog
function hideEditDialog(overlay) {
    overlay.classList.add('fade-out');
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.remove();
        }
    }, 300);
}

// Custom sentence edit dialog function
function showSentenceEditDialog(title, currentText, currentAuthor = '', icon = '📝') {
    return new Promise((resolve, reject) => {
        // Remove any existing edit dialogs
        const existingDialogs = document.querySelectorAll('.edit-overlay');
        existingDialogs.forEach(dialog => dialog.remove());
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'edit-overlay';
        overlay.innerHTML = `
            <div class="edit-dialog">
                <div class="edit-header">
                    <span class="edit-icon">${icon}</span>
                    <h3>${title}</h3>
                </div>
                <div class="edit-content">
                    <div class="edit-field">
                        <label>Sentence:</label>
                        <textarea id="editSentenceText" rows="3" placeholder="Enter sentence...">${currentText}</textarea>
                    </div>
                    <div class="edit-field">
                        <label>Author (optional):</label>
                        <input type="text" id="editSentenceAuthor" value="${currentAuthor}" placeholder="Enter author name...">
                    </div>
                </div>
                <div class="edit-buttons">
                    <button class="edit-btn cancel">Cancel</button>
                    <button class="edit-btn save">Save Changes</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        overlay.querySelector('.cancel').onclick = () => {
            hideEditDialog(overlay);
            resolve(null);
        };
        
        overlay.querySelector('.save').onclick = () => {
            const newText = document.getElementById('editSentenceText').value.trim();
            const newAuthor = document.getElementById('editSentenceAuthor').value.trim();
            
            if (newText) {
                hideEditDialog(overlay);
                resolve({ text: newText, author: newAuthor });
            } else {
                // Show validation error
                showNotification('Please enter a sentence!', 'error', '⚠️');
            }
        };
        
        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                hideEditDialog(overlay);
                resolve(null);
            }
        };
        
        // Handle Enter key to save (Ctrl+Enter for textarea)
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                overlay.querySelector('.save').click();
            } else if (e.key === 'Escape') {
                overlay.querySelector('.cancel').click();
            }
        });
        
        // Add to page and show
        document.body.appendChild(overlay);
        
        // Focus on textarea
        setTimeout(() => {
            const textarea = document.getElementById('editSentenceText');
            textarea.focus();
            textarea.select();
        }, 100);
    });
}

// Add interactive features to your learning journal
document.addEventListener('DOMContentLoaded', function() {
    console.log('English Learning Journal loaded!');
    
    // Load saved vocabulary and sentences on page load
    loadSavedVocab();
    loadSavedSentences();
    
    // Initialize search functionality
    initializeSearch();
    
    // Initialize enhanced navigation
    initializeNavigation();
    
    // Initialize mobile-specific features
    initializeMobileFeatures();
    
    // Initialize translation toggle
    initializeTranslationToggle();
    
    // Initialize AI vocabulary suggestions
    initializeAISuggestions();
    
    // Initialize form toggles
    initializeFormToggles();
    
    // Add Enter key support for vocabulary form
    const newWordInput = document.getElementById('newWord');
    const newDefinitionInput = document.getElementById('newDefinition');
    const newWordIDInput = document.getElementById('newWordID');
    const newDefinitionIDInput = document.getElementById('newDefinitionID');
    
    if (newWordInput && newDefinitionInput) {
        newWordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                newDefinitionInput.focus(); // Move to definition field
            }
        });
        
        newDefinitionInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                if (newWordIDInput) {
                    newWordIDInput.focus(); // Move to Indonesian word field
                } else {
                    addNewVocab(); // Save the word if no Indonesian fields
                }
            }
        });
        
        if (newWordIDInput && newDefinitionIDInput) {
            newWordIDInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    newDefinitionIDInput.focus(); // Move to Indonesian definition field
                }
            });
            
            newDefinitionIDInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    addNewVocab(); // Save the word
                }
            });
        }
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
        addVocabularyToDOM(vocab.word, vocab.definition, index, vocab.wordID || '', vocab.definitionID || '');
    });
}

// Function to load saved sentences from localStorage
function loadSavedSentences() {
    const sentenceList = document.querySelector('.sentence-list');
    sentenceList.innerHTML = ''; // Clear existing items first
    savedSentences.forEach((sentence, index) => {
        addSentenceToDOM(sentence.text, sentence.author, index, sentence.textID || '');
    });
}

// Function to refresh vocabulary display
function refreshVocabDisplay() {
    const vocabList = document.querySelector('#vocab ul');
    vocabList.innerHTML = '';
    savedVocab.forEach((vocab, index) => {
        addVocabularyToDOM(vocab.word, vocab.definition, index, vocab.wordID || '', vocab.definitionID || '');
    });
}

// Function to refresh sentences display
function refreshSentencesDisplay() {
    const sentenceList = document.querySelector('.sentence-list');
    sentenceList.innerHTML = '';
    savedSentences.forEach((sentence, index) => {
        addSentenceToDOM(sentence.text, sentence.author, index, sentence.textID || '');
    });
}

// Function to add vocabulary to DOM only
function addVocabularyToDOM(word, definition, index, wordID = '', definitionID = '') {
    const vocabList = document.querySelector('#vocab ul');
    const newItem = document.createElement('li');
    newItem.className = 'vocab-item';
    
    const translationHTML = (wordID || definitionID) ? `
        <div class="translation" style="display: ${translationsVisible ? 'block' : 'none'};">
            <strong>${wordID || word}</strong> – ${definitionID || definition}
        </div>
    ` : '';
    
    newItem.innerHTML = `
        <div class="vocab-item-content">
            <div class="item-content">
                <strong>${word}</strong> – ${definition}
            </div>
            ${translationHTML}
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
function addVocabulary(word, definition, wordID = '', definitionID = '') {
    // Save to localStorage first
    savedVocab.push({ 
        word: word, 
        definition: definition, 
        wordID: wordID, 
        definitionID: definitionID 
    });
    localStorage.setItem('vocabList', JSON.stringify(savedVocab));
    
    // Refresh the entire display to ensure correct indexes
    refreshVocabDisplay();
}

// Function to handle form submission
function addNewVocab() {
    const wordInput = document.getElementById('newWord');
    const definitionInput = document.getElementById('newDefinition');
    const wordIDInput = document.getElementById('newWordID');
    const definitionIDInput = document.getElementById('newDefinitionID');
    
    const word = wordInput.value.trim();
    const definition = definitionInput.value.trim();
    const wordID = wordIDInput ? wordIDInput.value.trim() : '';
    const definitionID = definitionIDInput ? definitionIDInput.value.trim() : '';
    
    if (word && definition) {
        addVocabulary(word, definition, wordID, definitionID);
        
        // Clear the form
        wordInput.value = '';
        definitionInput.value = '';
        if (wordIDInput) wordIDInput.value = '';
        if (definitionIDInput) definitionIDInput.value = '';
        
        // Hide AI suggestions after adding
        hideAISuggestions();
        
        // Show custom notification
        showNotification(`Word "${word}" added successfully!`, 'success', '📖');
        
        // Optional: Hide the form after adding
        const vocabForm = document.getElementById('vocabForm');
        const toggleBtn = document.getElementById('toggleVocabForm');
        if (vocabForm && toggleBtn) {
            vocabForm.style.display = 'none';
            toggleBtn.classList.remove('active');
        }
    } else {
        // Show error notification for empty fields
        showNotification('Please fill in both the word and definition!', 'delete', '⚠️');
    }
}

// Function to add sentence to DOM only
function addSentenceToDOM(sentence, author, index, sentenceID = '') {
    const sentenceList = document.querySelector('.sentence-list');
    const newSentence = document.createElement('div');
    newSentence.className = 'sentence-item';
    
    const sentenceText = author ? `"${sentence}" – ${author}` : `"${sentence}"`;
    const translationHTML = sentenceID ? `
        <div class="translation" style="display: ${translationsVisible ? 'block' : 'none'};">
            <p style="font-style: italic;">"${sentenceID}"${author ? ` – ${author}` : ''}</p>
        </div>
    ` : '';
    
    newSentence.innerHTML = `
        <div class="sentence-item-content">
            <div class="item-content" style="font-style: italic;">
                ${sentenceText}
            </div>
            ${translationHTML}
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
function addSentence(sentence, author, sentenceID = '') {
    // Save to localStorage first
    savedSentences.push({ 
        text: sentence, 
        author: author, 
        textID: sentenceID 
    });
    localStorage.setItem('sentenceList', JSON.stringify(savedSentences));
    
    // Refresh the entire display to ensure correct indexes
    refreshSentencesDisplay();
}

// Function to handle sentence form submission
function addNewSentence() {
    const sentenceInput = document.getElementById('newSentence');
    const authorInput = document.getElementById('sentenceAuthor');
    const sentenceIDInput = document.getElementById('newSentenceID');
    
    const sentence = sentenceInput.value.trim();
    const author = authorInput.value.trim();
    const sentenceID = sentenceIDInput ? sentenceIDInput.value.trim() : '';
    
    if (sentence) {
        addSentence(sentence, author, sentenceID);
        
        // Clear the form
        sentenceInput.value = '';
        authorInput.value = '';
        if (sentenceIDInput) sentenceIDInput.value = '';
        
        // Show custom notification
        showNotification('Sentence added to your collection!', 'success', '✍️');
        
        // Optional: Hide the form after adding
        const sentenceForm = document.getElementById('sentenceForm');
        const toggleBtn = document.getElementById('toggleSentenceForm');
        if (sentenceForm && toggleBtn) {
            sentenceForm.style.display = 'none';
            toggleBtn.classList.remove('active');
        }
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
async function editVocab(index) {
    const vocab = savedVocab[index];
    const result = await showEditDialog('Edit Vocabulary', vocab.word, vocab.definition);
    
    if (result) {
        savedVocab[index] = { word: result.word, definition: result.definition };
        localStorage.setItem('vocabList', JSON.stringify(savedVocab));
        refreshVocabDisplay();
        
        // Show edit notification
        showNotification(`Word "${result.word}" updated!`, 'edit', '📝');
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
async function editSentence(index) {
    const sentence = savedSentences[index];
    const result = await showSentenceEditDialog('Edit Sentence', sentence.text, sentence.author || '');
    
    if (result) {
        savedSentences[index] = { text: result.text, author: result.author };
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

// Search Functionality
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const clearSearchBtn = document.getElementById('clearSearch');
    const searchCount = document.getElementById('searchCount');
    
    if (!searchInput) return;
    
    // Search input event
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.trim();
        currentSearchTerm = searchTerm;
        
        if (searchTerm.length === 0) {
            hideSearchResults();
            clearHighlights();
            clearSearchBtn.style.display = 'none';
            searchCount.textContent = '';
            return;
        }
        
        if (searchTerm.length >= 2) {
            performSearch(searchTerm);
        }
    });
    
    // Clear search button
    clearSearchBtn.addEventListener('click', function() {
        searchInput.value = '';
        currentSearchTerm = '';
        hideSearchResults();
        clearHighlights();
        clearSearchBtn.style.display = 'none';
        searchCount.textContent = '';
        searchInput.focus();
    });
    
    // Hide search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            hideSearchResults();
        }
    });
}

function performSearch(searchTerm) {
    const results = [];
    const term = searchTerm.toLowerCase();
    
    // Search vocabulary
    savedVocab.forEach((vocab, index) => {
        if (vocab.word.toLowerCase().includes(term) || vocab.definition.toLowerCase().includes(term)) {
            results.push({
                type: 'vocabulary',
                title: vocab.word,
                content: vocab.definition,
                section: 'vocab',
                index: index
            });
        }
    });
    
    // Search sentences
    savedSentences.forEach((sentence, index) => {
        if (sentence.text.toLowerCase().includes(term) || (sentence.author && sentence.author.toLowerCase().includes(term))) {
            results.push({
                type: 'sentence',
                title: sentence.text.substring(0, 50) + (sentence.text.length > 50 ? '...' : ''),
                content: sentence.author || 'No author',
                section: 'sentences',
                index: index
            });
        }
    });
    
    // Search grammar content
    const grammarSection = document.querySelector('#grammar');
    if (grammarSection) {
        const grammarText = grammarSection.textContent.toLowerCase();
        if (grammarText.includes(term)) {
            results.push({
                type: 'grammar',
                title: 'Grammar Section',
                content: 'Found in grammar rules and examples',
                section: 'grammar',
                index: -1
            });
        }
    }
    
    displaySearchResults(results);
    highlightSearchTerms(searchTerm);
    
    // Update UI elements
    const clearSearchBtn = document.getElementById('clearSearch');
    const searchCount = document.getElementById('searchCount');
    
    clearSearchBtn.style.display = results.length > 0 || currentSearchTerm ? 'block' : 'none';
    searchCount.textContent = results.length > 0 ? `${results.length} found` : currentSearchTerm ? 'No matches' : '';
}

function displaySearchResults(results) {
    const searchResultsDiv = document.getElementById('searchResults');
    
    if (results.length === 0) {
        searchResultsDiv.innerHTML = '<div class="search-result-item">No results found</div>';
        searchResultsDiv.style.display = 'block';
        return;
    }
    
    const resultsHTML = results.map(result => `
        <div class="search-result-item" onclick="navigateToResult('${result.section}', ${result.index})">
            <div class="search-result-type">${result.type}</div>
            <div><strong>${highlightText(result.title, currentSearchTerm)}</strong></div>
            <div style="font-size: 0.9rem; color: #666;">${highlightText(result.content, currentSearchTerm)}</div>
        </div>
    `).join('');
    
    searchResultsDiv.innerHTML = resultsHTML;
    searchResultsDiv.style.display = 'block';
}

function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

function highlightSearchTerms(searchTerm) {
    clearHighlights();
    
    if (!searchTerm) return;
    
    const sections = ['vocab', 'grammar', 'sentences'];
    
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            highlightInElement(section, searchTerm);
        }
    });
}

function highlightInElement(element, searchTerm) {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    const textNodes = [];
    let node;
    
    while (node = walker.nextNode()) {
        if (node.nodeValue.toLowerCase().includes(searchTerm.toLowerCase())) {
            textNodes.push(node);
        }
    }
    
    textNodes.forEach(textNode => {
        const parent = textNode.parentNode;
        if (parent.classList.contains('search-highlight')) return;
        
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const highlightedText = textNode.nodeValue.replace(regex, '<span class="search-highlight">$1</span>');
        
        if (highlightedText !== textNode.nodeValue) {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = highlightedText;
            
            while (wrapper.firstChild) {
                parent.insertBefore(wrapper.firstChild, textNode);
            }
            parent.removeChild(textNode);
        }
    });
}

function clearHighlights() {
    const highlights = document.querySelectorAll('.search-highlight');
    highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
    });
}

function hideSearchResults() {
    const searchResultsDiv = document.getElementById('searchResults');
    searchResultsDiv.style.display = 'none';
}

function navigateToResult(section, index) {
    hideSearchResults();
    
    // Smooth scroll to section
    const targetSection = document.getElementById(section);
    if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Update active navigation
        updateActiveNavigation(section);
        
        // If it's a specific item, highlight it briefly
        if (index >= 0) {
            setTimeout(() => {
                const items = section === 'vocab' ? 
                    document.querySelectorAll('.vocab-item') : 
                    document.querySelectorAll('.sentence-item');
                
                if (items[index]) {
                    items[index].style.transform = 'scale(1.05)';
                    items[index].style.boxShadow = '0 8px 25px rgba(107, 115, 255, 0.3)';
                    
                    setTimeout(() => {
                        items[index].style.transform = '';
                        items[index].style.boxShadow = '';
                    }, 1500);
                }
            }, 500);
        }
    }
}

// Mobile-specific features
function initializeMobileFeatures() {
    // Auto-hide search results on mobile when scrolling
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        if (window.innerWidth <= 768) {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (document.getElementById('searchInput') !== document.activeElement) {
                    hideSearchResults();
                }
            }, 150);
        }
    });
    
    // Better mobile keyboard handling
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('focus', function() {
            // Scroll to top on mobile when focusing search
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
            }
        });
        
        // Hide results when losing focus on mobile
        searchInput.addEventListener('blur', function() {
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    hideSearchResults();
                }, 200); // Delay to allow result clicks
            }
        });
    }
    
    // Touch-friendly interactions for dynamically created elements
    document.addEventListener('click', function(e) {
        if (e.target.matches('.vocab-item, .sentence-item')) {
            // Add subtle feedback for touch on mobile
            if (window.innerWidth <= 768) {
                e.target.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    e.target.style.transform = '';
                }, 150);
            }
        }
    });
}

// Enhanced Navigation
function initializeNavigation() {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                updateActiveNavigation(targetId);
            }
        });
    });
    
    // Update active navigation on scroll
    window.addEventListener('scroll', updateNavigationOnScroll);
}

function updateActiveNavigation(activeSection) {
    const navLinks = document.querySelectorAll('nav a[href^="#"]');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href').substring(1);
        if (href === activeSection) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function updateNavigationOnScroll() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPos = window.scrollY + 200;
    
    sections.forEach(section => {
        const top = section.offsetTop;
        const bottom = top + section.offsetHeight;
        
        if (scrollPos >= top && scrollPos <= bottom) {
            updateActiveNavigation(section.id);
        }
    });
}

// Example usage:
// addVocabulary('Perseverance', 'persistence in doing something despite difficulty or delay');

// Translation Toggle Functions
function initializeTranslationToggle() {
    const toggleBtn = document.getElementById('translationToggle');
    if (!toggleBtn) return;
    
    // Load saved preference
    translationsVisible = localStorage.getItem('translationsVisible') === 'true';
    updateTranslationButton(toggleBtn);
    updateTranslationVisibility();
    
    // Add click event
    toggleBtn.addEventListener('click', function() {
        translationsVisible = !translationsVisible;
        localStorage.setItem('translationsVisible', translationsVisible.toString());
        
        updateTranslationButton(toggleBtn);
        updateTranslationVisibility();
        
        // Show notification
        const message = translationsVisible ? 
            'Indonesian translations shown! 🇮🇩' : 
            'Indonesian translations hidden! 🇺🇸';
        showNotification(message, 'success', translationsVisible ? '🇮🇩' : '🇺🇸');
    });
}

function updateTranslationButton(button) {
    if (translationsVisible) {
        button.textContent = '🇺🇸 EN';
        button.classList.add('active');
        button.title = 'Hide Indonesian translations';
    } else {
        button.textContent = '🇮🇩 ID';
        button.classList.remove('active');
        button.title = 'Show Indonesian translations';
    }
}

function updateTranslationVisibility() {
    const allTranslations = document.querySelectorAll('.translation');
    allTranslations.forEach(translation => {
        translation.style.display = translationsVisible ? 'block' : 'none';
    });
}

// AI Vocabulary Suggestions Functions
function initializeAISuggestions() {
    // Load saved API key
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
        geminiApiKey = savedApiKey;
        console.log('✅ Gemini API key loaded - Real AI active!');
    }
    
    const newWordInput = document.getElementById('newWord');
    if (!newWordInput) return;
    
    let debounceTimer;
    newWordInput.addEventListener('input', function(e) {
        clearTimeout(debounceTimer);
        const word = e.target.value.trim();
        
        if (word.length >= 3) {
            debounceTimer = setTimeout(() => {
                generateVocabularySuggestions(word);
            }, 800); // Wait for user to stop typing
        } else {
            hideAISuggestions();
        }
    });
}

function generateVocabularySuggestions(word) {
    const suggestionsPanel = document.getElementById('aiSuggestions');
    const suggestionsContent = document.getElementById('suggestionsContent');
    
    if (!suggestionsPanel || !suggestionsContent) return;
    
    // Check if API key is set
    if (!geminiApiKey) {
        showApiKeyPrompt();
        return;
    }
    
    // Show loading state
    suggestionsContent.innerHTML = '<div class="ai-loading">🤖 AI is thinking...</div>';
    suggestionsPanel.style.display = 'block';
    
    // Call real Google Gemini AI
    callGeminiAI(word);
}

async function callGeminiAI(word) {
    const suggestionsContent = document.getElementById('suggestionsContent');
    
    try {
        const prompt = `Help me learn the English word or phrase "${word}". Give me a JSON response with this exact format (no extra text):

{
  "synonyms": ["word1", "word2", "word3"],
  "antonyms": ["word1", "word2", "word3"], 
  "related": ["word1", "word2", "word3"],
  "examples": ["Example sentence 1", "Example sentence 2", "Example sentence 3"]
}

Important:
- Only return valid JSON, nothing else
- Use simple, common English words
- Make examples realistic and natural
- If it's a phrase, treat it as one unit`;

        console.log('🔄 Calling Gemini AI for:', word);
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 400,
                topP: 1,
                topK: 32
            }
        };

        console.log('📤 Request body:', requestBody);

        const response = await fetch(`${GEMINI_API_URL}?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('📥 Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error Response:', errorText);
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('📋 AI Response data:', data);

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid response format from AI');
        }

        const aiResponse = data.candidates[0].content.parts[0].text;
        console.log('🤖 AI Raw Response:', aiResponse);

        // Clean and parse the JSON response
        let cleanResponse = aiResponse.trim();
        
        // Remove any markdown code blocks if present
        cleanResponse = cleanResponse.replace(/```json\s*|\s*```/g, '');
        cleanResponse = cleanResponse.replace(/```\s*|\s*```/g, '');
        
        // Find JSON object in the response
        const jsonStart = cleanResponse.indexOf('{');
        const jsonEnd = cleanResponse.lastIndexOf('}') + 1;
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
            cleanResponse = cleanResponse.substring(jsonStart, jsonEnd);
        }

        console.log('🧹 Cleaned Response:', cleanResponse);

        const suggestions = JSON.parse(cleanResponse);
        console.log('✅ Parsed Suggestions:', suggestions);
        
        displayVocabularySuggestions(suggestions, word);
        
    } catch (error) {
        console.error('❌ Gemini AI Error:', error);
        
        // Show detailed error information
        let errorMessage = 'Unknown error occurred';
        if (error.message.includes('API Error 400')) {
            errorMessage = 'Invalid API request. Please check your API key.';
        } else if (error.message.includes('API Error 403')) {
            errorMessage = 'API key is invalid or expired. Please update it.';
        } else if (error.message.includes('API Error 429')) {
            errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('JSON')) {
            errorMessage = 'AI response format error. Using fallback suggestions.';
        }
        
        suggestionsContent.innerHTML = `
            <div class="ai-error">
                <h5>🚫 AI Error</h5>
                <p><strong>Error:</strong> ${errorMessage}</p>
                <p><small>Technical details: ${error.message}</small></p>
                <div class="error-actions">
                    <button onclick="retryAI('${word}')" class="retry-btn">🔄 Try Again</button>
                    <button onclick="useFallbackSuggestions('${word}')" class="fallback-btn">📝 Use Basic Mode</button>
                    <button onclick="showApiKeyPrompt()" class="api-key-btn">🔑 Update API Key</button>
                </div>
            </div>
        `;
    }
}

function showApiKeyPrompt() {
    const modal = document.createElement('div');
    modal.className = 'api-key-modal';
    modal.innerHTML = `
        <div class="api-key-dialog">
            <h3>🔑 Google Gemini API Key Required</h3>
            <p>To use real AI vocabulary suggestions, you need a FREE Google Gemini API key:</p>
            
            <ol>
                <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a></li>
                <li>Click "Create API Key"</li>
                <li>Copy the key and paste it below</li>
            </ol>
            
            <input type="password" id="apiKeyInput" placeholder="Paste your API key here..." />
            <div class="api-key-actions">
                <button onclick="saveApiKey()">Save & Use AI</button>
                <button onclick="closeApiKeyModal()">Cancel</button>
                <button onclick="useFallbackMode()">Use Without AI</button>
            </div>
            
            <small>✅ Your API key is stored locally and never shared</small>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function saveApiKey() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const key = apiKeyInput.value.trim();
    
    if (key) {
        geminiApiKey = key;
        localStorage.setItem('geminiApiKey', key);
        closeApiKeyModal();
        showNotification('API Key saved! AI is now active 🤖', 'success');
    } else {
        showNotification('Please enter a valid API key', 'error');
    }
}

function closeApiKeyModal() {
    const modal = document.querySelector('.api-key-modal');
    if (modal) {
        modal.remove();
    }
}

function useFallbackMode() {
    closeApiKeyModal();
    showNotification('Using basic suggestions without AI', 'info');
    // Use the old system as fallback
    const word = document.getElementById('newWord').value;
    if (word) {
        const suggestions = getLocalVocabularySuggestions(word);
        displayVocabularySuggestions(suggestions, word);
    }
}

function getLocalVocabularySuggestions(word) {
    // Fallback vocabulary suggestion database (used when AI is not available)
    const vocabularyDB = {
        // Common words for fallback
        'forget': {
            synonyms: ['overlook', 'neglect', 'omit', 'ignore'],
            antonyms: ['remember', 'recall', 'recollect', 'retain'],
            related: ['memory', 'recall', 'mind', 'think'],
            examples: [
                'Don\'t forget to call your mother.',
                'I always forget where I put my keys.',
                'Please don\'t forget our meeting tomorrow.'
            ]
        },
        'calm down': {
            synonyms: ['relax', 'chill out', 'settle down', 'take it easy'],
            antonyms: ['get worked up', 'panic', 'lose control', 'freak out'],
            related: ['breathe', 'compose yourself', 'stay cool', 'unwind'],
            examples: [
                'Calm down, everything will be alright.',
                'I need to calm down before the presentation.',
                'Please calm down and tell me what happened.'
            ]
        }
    };
    
    // Check if we have specific data for this word (handle both phrases and single words)
    const searchTerm = word.toLowerCase().trim();
    if (vocabularyDB[searchTerm]) {
        return vocabularyDB[searchTerm];
    }
    
    // Generate basic suggestions based on word patterns
    return generateBasicSuggestions(word);
}

function generateBasicSuggestions(word) {
    // Basic pattern-based suggestions as fallback
    return {
        synonyms: ['similar word', 'related term', 'equivalent'],
        antonyms: ['opposite word', 'contrary term'],
        related: ['connected word', 'associated term', 'linked concept'],
        examples: [
            `I need to understand the word "${word}" better.`,
            `The meaning of "${word}" is important to learn.`,
            `Using "${word}" in context helps with learning.`
        ]
    };
}

function useFallbackSuggestions(word) {
    const suggestions = getLocalVocabularySuggestions(word);
    displayVocabularySuggestions(suggestions, word);
}

function retryAI(word) {
    console.log('🔄 Retrying AI for word:', word);
    generateVocabularySuggestions(word);
}

function generateContextualSuggestions(word) {
    // Smart pattern-based suggestions
    const patterns = {
        // Words ending in -tion
        'tion$': {
            related: ['process', 'action', 'method', 'procedure'],
            examples: [`The ${word} requires careful planning.`, `Understanding ${word} is important.`]
        },
        // Words ending in -ness
        'ness$': {
            related: ['quality', 'characteristic', 'trait', 'attribute'],
            examples: [`Her ${word} impressed everyone.`, `${word} is a valuable quality.`]
        },
        // Words ending in -ly (adverbs)
        'ly$': {
            related: ['manner', 'way', 'style', 'approach'],
            examples: [`She worked ${word} on the project.`, `He spoke ${word} to the audience.`]
        },
        // Words ending in -able
        'able$': {
            related: ['capable', 'possible', 'feasible', 'practical'],
            examples: [`The solution is ${word} and effective.`, `This approach is ${word} for our needs.`]
        }
    };
    
    // Find matching patterns
    for (const [pattern, data] of Object.entries(patterns)) {
        if (new RegExp(pattern).test(word)) {
            return {
                synonyms: [],
                antonyms: [],
                related: data.related,
                examples: data.examples
            };
        }
    }
    
    // Default general suggestions
    return {
        synonyms: [],
        antonyms: [],
        related: ['concept', 'idea', 'term', 'meaning'],
        examples: [
            `Learning the word "${word}" expands your vocabulary.`,
            `Understanding "${word}" helps in communication.`,
            `The word "${word}" can be used in various contexts.`
        ]
    };
}

function displayVocabularySuggestions(suggestions, originalWord) {
    const suggestionsContent = document.getElementById('suggestionsContent');
    if (!suggestionsContent) return;
    
    let html = '';
    
    // Synonyms section
    if (suggestions.synonyms && suggestions.synonyms.length > 0) {
        html += `
            <div class="suggestion-section">
                <h5>📝 Synonyms (Similar Words)</h5>
                <div class="suggestion-items">
                    ${suggestions.synonyms.map(word => 
                        `<button class="suggestion-item" onclick="useSuggestion('${word}')">${word}</button>`
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    // Antonyms section
    if (suggestions.antonyms && suggestions.antonyms.length > 0) {
        html += `
            <div class="suggestion-section">
                <h5>🔄 Antonyms (Opposite Words)</h5>
                <div class="suggestion-items">
                    ${suggestions.antonyms.map(word => 
                        `<button class="suggestion-item" onclick="useSuggestion('${word}')">${word}</button>`
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    // Related words section
    if (suggestions.related && suggestions.related.length > 0) {
        html += `
            <div class="suggestion-section">
                <h5>🔗 Related Words</h5>
                <div class="suggestion-items">
                    ${suggestions.related.map(word => 
                        `<button class="suggestion-item" onclick="useSuggestion('${word}')">${word}</button>`
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    // Example sentences section
    if (suggestions.examples && suggestions.examples.length > 0) {
        html += `
            <div class="suggestion-section">
                <h5>💡 Example Sentences</h5>
                ${suggestions.examples.map(example => 
                    `<div class="example-sentence" onclick="useExampleSentence('${example.replace(/'/g, "\\\'")}')">${example}</div>`
                ).join('')}
            </div>
        `;
    }
    
    if (html) {
        suggestionsContent.innerHTML = html;
    } else {
        suggestionsContent.innerHTML = `
            <div class="suggestion-section">
                <h5>🤖 AI Learning Tips</h5>
                <p>Try words like "creative", "confident", "dedicated", or "resilience" for rich suggestions!</p>
                <p>The AI learns better with common English words.</p>
            </div>
        `;
    }
}

function useSuggestion(word) {
    const newWordInput = document.getElementById('newWord');
    if (newWordInput) {
        newWordInput.value = word;
        newWordInput.focus();
        
        // Trigger suggestions for the new word
        setTimeout(() => {
            generateVocabularySuggestions(word);
        }, 500);
        
        showNotification(`Suggested word "${word}" selected!`, 'success', '🤖');
    }
}

function useExampleSentence(sentence) {
    // Copy to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(sentence).then(() => {
            showNotification('Example sentence copied! Paste it in sentences section.', 'success', '📋');
        });
    } else {
        showNotification('Click on sentences section to add this example!', 'success', '💡');
    }
    
    // Smooth scroll to sentences section
    const sentencesSection = document.getElementById('sentences');
    if (sentencesSection) {
        setTimeout(() => {
            sentencesSection.scrollIntoView({ behavior: 'smooth' });
        }, 1000);
    }
}

function hideAISuggestions() {
    const suggestionsPanel = document.getElementById('aiSuggestions');
    if (suggestionsPanel) {
        suggestionsPanel.style.display = 'none';
    }
}

// Form Toggle Functions
function initializeFormToggles() {
    // Vocabulary form toggle
    const vocabToggle = document.getElementById('toggleVocabForm');
    const vocabForm = document.getElementById('vocabForm');
    
    if (vocabToggle && vocabForm) {
        vocabToggle.addEventListener('click', function() {
            const isVisible = vocabForm.style.display !== 'none';
            
            if (isVisible) {
                // Hide form
                vocabForm.style.display = 'none';
                vocabToggle.classList.remove('active');
                hideAISuggestions();
            } else {
                // Show form
                vocabForm.style.display = 'block';
                vocabToggle.classList.add('active');
                
                // Focus on first input
                const wordInput = document.getElementById('newWord');
                if (wordInput) {
                    setTimeout(() => wordInput.focus(), 100);
                }
            }
        });
    }
    
    // Sentence form toggle
    const sentenceToggle = document.getElementById('toggleSentenceForm');
    const sentenceForm = document.getElementById('sentenceForm');
    
    if (sentenceToggle && sentenceForm) {
        sentenceToggle.addEventListener('click', function() {
            const isVisible = sentenceForm.style.display !== 'none';
            
            if (isVisible) {
                // Hide form
                sentenceForm.style.display = 'none';
                sentenceToggle.classList.remove('active');
            } else {
                // Show form
                sentenceForm.style.display = 'block';
                sentenceToggle.classList.add('active');
                
                // Focus on first textarea
                const sentenceInput = document.getElementById('newSentence');
                if (sentenceInput) {
                    setTimeout(() => sentenceInput.focus(), 100);
                }
            }
        });
    }
}
