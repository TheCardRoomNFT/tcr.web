function updateImage() {
    const imgIds = ['img1', 'img2', 'img3', 'img4'];
    const imgIdIdx = Math.floor(Math.random() * imgIds.length);

    const images = [
        '/images/EmperorCharles-card.png',
        '/images/HulaHosky-card.png',
        '/images/KingCharles-card.png',
        '/images/KingOfRats-card.png',
        '/images/Mutation-AcidRain-card.png',
        '/images/Mutation-ChinSwingers-card.png',
        '/images/Mutation-MicroDosing-card.png',
        '/images/Mutation-TheHulk-card.png',
        '/images/mutation01.png',
        '/images/mutation02.png',
        '/images/mutation03.png',
        '/images/mutation04.png',
        '/images/mutation05.png',
        '/images/mutation06.png',
        '/images/mutation07.png',
        '/images/mutation08.png',
        '/images/mutation09.png',
        '/images/mutation10.png'
    ];

    const imageIdx = Math.floor(Math.random() * images.length);

    var element = document.getElementById(imgIds[imgIdIdx]);
    if (element != null) {
        element.src=images[imageIdx];
    }
}

window.setInterval(updateImage, 2000);
