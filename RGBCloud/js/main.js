function initFileReader(){
  document.getElementById('image').addEventListener('change', function(evt){
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.target.files; // FileList object.
    var file = files[0];
    if (!file.type.match('image.*')) return;

    var reader = new FileReader();
    reader.onload = function(){
      var canvas = document.getElementById('canvas');
      var context = canvas.getContext('2d');
      var preview = document.getElementById('preview');
      var image = new Image();
      image.src = reader.result;
      image.addEventListener('load', function(){
        var width = image.width, height = image.height;
        canvas.width = width;
        canvas.height = height;
        context.drawImage(image, 0, 0);

        var ratio = 200 / Math.min(width, height);
        preview.width = width * ratio;
        preview.height = height * ratio;
        preview.getContext('2d').drawImage(image, 0, 0, width * ratio, height * ratio);

        getHistogram(context.getImageData(0, 0, width, height));
      });
    };
    reader.readAsDataURL(file);
  }, false);
}

function getHistogram(imageData){
  var histogram = new Map();
  var array = imageData.data;
  var r, g, b, index, val;

  for (var i = 0; i < imageData.width * imageData.height; i++) {
    r = array[4*i + 0], g = array[4*i + 1], b = array[4*i + 2];
    index = (r << 16) | (g << 8) | b;

    val = histogram.get(index);
    if(val === undefined) val = 0;

    histogram.set(index, val + 1);
  }

  renderHistogram(histogram);
}

var scene, camera, controls, renderer, wireMat;
function initVisualizer(){
  var container = document.getElementById('visualizer');

  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor( new THREE.Color(0xffffff),0.0);
  //renderer.setClearColor( 0x000000 );
	renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  camera = new THREE.PerspectiveCamera( 27, window.innerWidth / window.innerHeight, 5, 3500 );
  camera.position.z = 1000;

  controls = new THREE.TrackballControls(camera);
  controls.rotateSpeed = 1.8;
	controls.zoomSpeed = 1.8;
	controls.panSpeed = 0.05;

  scene = new THREE.Scene();
  var wireGeo = new THREE.EdgesGeometry( new THREE.CubeGeometry(256, 256, 256) );
  wireMat = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 1 } );
  var wireFrame = new THREE.LineSegments( wireGeo, wireMat );
  scene.add( wireFrame );

  animate();
}

var currentPoints = null;
function renderHistogram(histogram, min, max){
  // clear children
  if(currentPoints !== null)
    scene.remove(currentPoints);

  var geometry = new THREE.BufferGeometry();
  var particles = histogram.size;
	var positions = new Float32Array( particles * 3 );
	var colors = new Float32Array( particles * 3 );
  var sizes = new Float32Array( particles );
  var color = new THREE.Color();
  var cnt = 0;

  histogram.forEach(function(value, key) {
    var r = (key >> 16) & 255;
    var g = (key >> 8) & 255;
    var b = key & 255;
    positions[cnt] = r - 128;
    positions[cnt + 1] = g - 128;
    positions[cnt + 2] = b - 128;

    color.setRGB( r / 255, g / 255, b / 255 );
		colors[cnt]     = color.r;
		colors[cnt + 1] = color.g;
		colors[cnt + 2] = color.b;

    sizes[cnt / 3] = Math.log(2 + value);

    cnt += 3;
  });

	geometry.addAttribute('position', new THREE.BufferAttribute( positions, 3 ) );
	geometry.addAttribute('color', new THREE.BufferAttribute( colors, 3 ) );
  geometry.addAttribute('size', new THREE.BufferAttribute( sizes, 1 ));
	geometry.computeBoundingSphere();

	//var material = new THREE.PointsMaterial( { size: 1, vertexColors: THREE.VertexColors } );
  var material = new THREE.ShaderMaterial({
    vertexShader: document.getElementById('vs').textContent,
    fragmentShader: document.getElementById('fs').textContent,
    transparent: true,
    depthWrite: false,
  });

	points = new THREE.Points( geometry, material );
	scene.add( points );
  currentPoints = points;
}

function animate() {
   requestAnimationFrame( animate );
   controls.update();
   renderer.render(scene, camera);
}

var currentColor = 'black';
function toggleColor(){
  var box = document.getElementById('preview-container');
  var button = document.getElementById('toggle-button');

  button.style.borderColor = box.style.borderColor = currentColor;
  button.style.color = box.style.color = currentColor;

  renderer.setClearColor( new THREE.Color(currentColor == 'black' ? 0xFFFFFF: 0x000000) );
  wireMat.color = new THREE.Color(currentColor == 'black' ? 0x000000: 0xFFFFFF);

  if(currentColor === 'black') {
    currentColor = 'white';
  } else {
    currentColor = 'black';
  }
}

window.addEventListener('load', function(){
  initFileReader();
  initVisualizer();

  document.getElementById('toggle-button').addEventListener('click', function(){
    toggleColor();
  });
}, false);

window.addEventListener('resize', function(){
	var aspect = window.innerWidth / window.innerHeight;
	camera.aspect = aspect;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}, false);
