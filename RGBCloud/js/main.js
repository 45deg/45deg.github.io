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

        var ratio = 200 / Math.max(width, height);
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

var scene, camera, controls, renderer;
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
  renderFrame('RGB');

  animate();
}

var wireMat = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 0.5, linewidth: 1 } );
var frame = null;
function renderFrame(type){
  const SIZE = 256;

  if(frame !== null)
    scene.remove(frame);

  if(type === 'RGB') {
    // cube
    var wireGeo = new THREE.EdgesGeometry( new THREE.CubeGeometry(SIZE, SIZE, SIZE) );
    frame = new THREE.LineSegments( wireGeo, wireMat );
    scene.add( frame );
  } else if(type === 'HSL'){
    // bicone
    frame = new THREE.Group();

    const circleSegments = 128, circleRadius = SIZE / 2;
    var circleGeom = new THREE.Geometry();
    var colors = [];
    for(var i = 0; i < circleSegments; ++i){
      var t = i / circleSegments;
      circleGeom.vertices.push(
        new THREE.Vector3( circleRadius * Math.cos(2 * Math.PI * t),
                           circleRadius * Math.sin(2 * Math.PI * t),
                           0 )
      );
      colors[i] = new THREE.Color();

      console.log(t)
      colors[i].setHSL(t, 1, 0.5);
    }
    circleGeom.colors = colors;
    var circleMat =  new THREE.LineBasicMaterial(
       { color: 0xffffff, opacity: 0.5,
         linewidth: 1, vertexColors: THREE.VertexColors } );
    frame.add( new THREE.LineLoop( circleGeom, circleMat ) );

    var wires = 8;
    for(var i = 0; i < wires; ++i){
      var x = SIZE / 2 * Math.cos(2 * Math.PI / wires * i);
      var y = SIZE / 2 * Math.sin(2 * Math.PI / wires * i);
      var lineGeom = new THREE.Geometry();
      lineGeom.vertices.push(new THREE.Vector3( 0, 0, SIZE / 2 ));
      lineGeom.vertices.push(new THREE.Vector3( x, y, 0 ));
      lineGeom.vertices.push(new THREE.Vector3( 0, 0, -SIZE / 2 ));
      frame.add( new THREE.Line( lineGeom, wireMat ) );
    }

    scene.add( frame );
  }
}

var currentPoints = null;
var geometry;
function renderHistogram(histogram, min, max){
  // clear children
  if(currentPoints !== null)
    scene.remove(currentPoints);

  geometry = new THREE.BufferGeometry();
  var particles = histogram.size;

	var positions = new Float32Array( particles * 3 );
	var colors = new Float32Array( particles * 3 );
  var sizes = new Float32Array( particles );

  var spaceIndex = spaces.indexOf(spaceStatus);
  var times = new Float32Array( particles ).fill(spaceIndex);

  var color = new THREE.Color();
  var cnt = 0;

  histogram.forEach(function(value, key) {
    var r = (key >> 16) & 255;
    var g = (key >> 8) & 255;
    var b = key & 255;
    positions[cnt] = r;
    positions[cnt + 1] = g;
    positions[cnt + 2] = b;

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
  geometry.addAttribute('time', new THREE.BufferAttribute( times, 1 ));
	geometry.computeBoundingSphere();

	//var material = new THREE.PointsMaterial( { size: 1, vertexColors: THREE.VertexColors } );
  var material = new THREE.ShaderMaterial({
    vertexShader: document.getElementById('vs').textContent,
    fragmentShader: document.getElementById('fs').textContent,
    transparent: true,
    depthWrite: true,
  });

	points = new THREE.Points( geometry, material );
	scene.add( points );
  currentPoints = points;
}

function animate() {
   requestAnimationFrame( animate );

   controls.update();

   if(spaceTransition) {
     // update transition
     var limit = spaceTransition.limit;
     var delta = spaceTransition.delta;
     var time = spaceTransition.value + delta;
     if(delta > 0 ? time > limit : time < limit) {
       // finish
       time = limit;
       spaceTransition = null;
     } else {
       spaceTransition.value = time;
     }
     // update buffer
     var timeAttr = geometry.attributes.time;
     timeAttr.array.fill(time);
     timeAttr.needsUpdate = true;
   }

   renderer.render(scene, camera);
}

var currentColor = 'black';
function toggleColor(){
  var box = document.getElementById('preview-container');
  var buttons = document.getElementsByTagName('button');

  for (var i = 0; i < buttons.length; i++) {
    buttons[i].style.borderColor = box.style.borderColor = currentColor;
    buttons[i].style.color = box.style.color = currentColor;
  }

  renderer.setClearColor( new THREE.Color(currentColor == 'black' ? 0xFFFFFF: 0x000000) );
  wireMat.color = new THREE.Color(currentColor == 'black' ? 0x000000: 0xFFFFFF);

  if(currentColor === 'black') {
    currentColor = 'white';
  } else {
    currentColor = 'black';
  }
}

var spaces = ["RGB", "HSL"];
var spaceStatus = spaces[0]; // index of spaces
var spaceTransition = null;
function toggleSpace() {
  var index = (spaces.indexOf(spaceStatus) + 1) % spaces.length;
  spaceStatus = spaces[index];
  this.innerHTML = spaceStatus;
  renderFrame(spaceStatus);

  if(geometry) {
    spaceTransition = {
      value: 1 - index,
      delta: index > 0 ? 0.05: -0.05,
      limit: index,
    };
  }
}

window.addEventListener('load', function(){
  initFileReader();
  initVisualizer();

  window.addEventListener('resize', function(){
  	var aspect = window.innerWidth / window.innerHeight;
  	camera.aspect = aspect;
  	camera.updateProjectionMatrix();

  	renderer.setSize( window.innerWidth, window.innerHeight );
  }, false);

  document.getElementById('toggle-colour').addEventListener('click', function(){
    toggleColor();
  });

  document.getElementById('toggle-space').addEventListener('click', toggleSpace);
}, false);
