// Creates the initial source image; no renderer or media state is modified.
export function createTestPattern() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 1024, 768);

    const colors = ['#C0C0C0', '#C0C000', '#00C0C0', '#00C000', '#C000C0', '#C00000', '#0000C0'];
    const barWidth = 1024 / colors.length;
    for (let i = 0; i < colors.length; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(i * barWidth, 0, barWidth, 500);
    }
    const bottomColors = ['#0000C0', '#000000', '#C000C0', '#000000', '#00C0C0', '#000000', '#C0C0C0'];
    for (let i = 0; i < bottomColors.length; i++) {
        ctx.fillStyle = bottomColors[i];
        ctx.fillRect(i * barWidth, 500, barWidth, 100);
    }

    ctx.beginPath();
    ctx.arc(512, 350, 200, 0, Math.PI * 2);
    ctx.lineWidth = 15;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 70px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CRT SIMULATOR', 512, 330);
    ctx.font = '30px sans-serif';
    ctx.fillText('Zoom in to see RGB phosphors', 512, 390);

    const grad = ctx.createLinearGradient(0, 600, 1024, 600);
    grad.addColorStop(0, '#000000');
    grad.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 600, 1024, 168);

    return { element: canvas, width: canvas.width, height: canvas.height, kind: 'image' };
}
