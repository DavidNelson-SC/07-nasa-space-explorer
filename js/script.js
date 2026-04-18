const API_KEY = 'iItIgTlPSMuMkhcJaA9rwA7sUyGcis6eAgMVRhvI';
const APOD_URL = 'https://api.nasa.gov/planetary/apod';

const facts = [
	'A day on Venus is longer than its year.',
	'The Sun contains 99.8% of the mass in our solar system.',
	'One million Earths could fit inside the Sun.',
	'Neutron stars can spin 600 times per second.',
	'There are more stars in the universe than grains of sand on Earth.',
	'Mars has the tallest volcano in the solar system, Olympus Mons.',
	'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.',
	'A year on Mercury is just 88 Earth days long.'
];

const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const fetchButton = document.getElementById('fetchButton');
const gallery = document.getElementById('gallery');
const statusMessage = document.getElementById('statusMessage');
const spaceFact = document.getElementById('spaceFact');
const modal = document.getElementById('modal');
const modalMedia = document.getElementById('modalMedia');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const closeModalButton = document.getElementById('closeModal');

let currentItems = [];

setupDateInputs(startInput, endInput);
showRandomFact();
fetchSpaceImages();

fetchButton.addEventListener('click', fetchSpaceImages);
closeModalButton.addEventListener('click', closeModal);
modal.addEventListener('click', handleModalBackdropClick);
document.addEventListener('keydown', handleEscapeKey);

function showRandomFact() {
	const randomFact = facts[Math.floor(Math.random() * facts.length)];
	spaceFact.textContent = randomFact;
}

async function fetchSpaceImages() {
	const startDate = startInput.value;
	const endDate = endInput.value;

	if (!startDate || !endDate) {
		return;
	}

	setStatus('🔄 Loading space photos...');
	gallery.innerHTML = '';

	try {
		const url = `${APOD_URL}?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}&thumbs=true`;
		const response = await fetch(url);

		if (!response.ok) {
			if (response.status === 403) {
				throw new Error('NASA rejected the request. Check your API key.');
			}

			if (response.status === 429) {
				throw new Error('NASA rate limit reached. Please try again later.');
			}

			throw new Error('NASA API request failed.');
		}

		const data = await response.json();
		currentItems = Array.isArray(data) ? data : [data];
		renderGallery(currentItems);

		if (!currentItems.length) {
			setStatus('No images were returned for that date range.');
			return;
		}

		setStatus(`Showing ${currentItems.length} space image${currentItems.length === 1 ? '' : 's'}.`);
	} catch (error) {
		console.error(error);
		gallery.innerHTML = `
			<div class="placeholder">
				<div class="placeholder-icon">🚨</div>
				<p>We could not load the NASA images right now. Please try again in a moment.</p>
			</div>
		`;
		setStatus(error.message);
	}
}

function renderGallery(items) {
	if (!items.length) {
		gallery.innerHTML = `
			<div class="placeholder">
				<div class="placeholder-icon">🛰️</div>
				<p>No space photos were found for that range.</p>
			</div>
		`;
		return;
	}

	gallery.innerHTML = items
		.map((item, index) => createGalleryItem(item, index))
		.join('');

	gallery.querySelectorAll('[data-gallery-index]').forEach((button) => {
		button.addEventListener('click', () => {
			const itemIndex = Number(button.dataset.galleryIndex);
			openModal(currentItems[itemIndex]);
		});
	});
}

function createGalleryItem(item, index) {
	const thumbnail = getThumbnail(item);
	const mediaLabel = item.media_type === 'video' ? 'Video' : 'Image';
	const buttonLabel = `${item.title}, ${item.date}`;

	return `
		<article class="gallery-item">
			<button class="gallery-item-button" type="button" data-gallery-index="${index}" aria-label="View details for ${escapeHtml(buttonLabel)}">
				<div class="media-frame">
					<img src="${escapeHtml(thumbnail)}" alt="${escapeHtml(item.title)}" loading="lazy" />
					<span class="media-badge">${mediaLabel}</span>
				</div>
				<div class="gallery-copy">
					<h3>${escapeHtml(item.title)}</h3>
					<p>${escapeHtml(item.date)}</p>
				</div>
			</button>
		</article>
	`;
}

function getThumbnail(item) {
	if (item.media_type === 'video' && item.thumbnail_url) {
		return item.thumbnail_url;
	}

	if (item.url) {
		return item.url;
	}

	return 'img/NASA-Logo-Large.jpg';
}

function openModal(item) {
	modalMedia.innerHTML = '';

	if (item.media_type === 'video') {
		modalMedia.innerHTML = `
			<a class="video-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">
				Watch the NASA video on YouTube
			</a>
		`;
	} else {
		modalMedia.innerHTML = `<img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.title)}" />`;
	}

	modalTitle.textContent = item.title;
	modalDate.textContent = item.date;
	modalExplanation.textContent = item.explanation;
	modal.classList.add('is-open');
	modal.setAttribute('aria-hidden', 'false');
	closeModalButton.focus();
}

function closeModal() {
	modal.classList.remove('is-open');
	modal.setAttribute('aria-hidden', 'true');
}

function handleModalBackdropClick(event) {
	if (event.target === modal) {
		closeModal();
	}
}

function handleEscapeKey(event) {
	if (event.key === 'Escape' && modal.classList.contains('is-open')) {
		closeModal();
	}
}

function setStatus(message) {
	statusMessage.textContent = message;
}

function escapeHtml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
