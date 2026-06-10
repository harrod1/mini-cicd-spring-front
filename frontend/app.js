fetch('/api/hello')
    .then(response => response.json())
    .then(data => {
        document.getElementById('message').innerText = data.message;
    })
    .catch(() => {
        document.getElementById('message').innerText = 'Erreur lors de l’appel API';
    });