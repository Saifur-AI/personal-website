// Fetch and display publications
async function loadPublications() {
  try {
    const response = await fetch('publications.json');
    if (!response.ok) throw new Error('Network error');
    const data = await response.json();

    const list = document.getElementById('pub-list');
    list.innerHTML = '';

    if (data.length === 0) {
      list.innerHTML = '<li>No publications found.</li>';
      return;
    }

    data.forEach(pub => {
      const li = document.createElement('li');
      li.innerHTML = `
        <a href="${pub.url || '#'}" target="_blank">${pub.title}</a>
        <div class="meta">${pub.authors} — <em>${pub.venue}</em> (${pub.year})</div>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    document.getElementById('pub-list').innerHTML =
      '<li>Failed to load publications.</li>';
    console.error(err);
  }
}

loadPublications();
