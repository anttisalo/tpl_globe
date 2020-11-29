import { OrbitControls } from "./OrbitControls.js";
import { Matrix4, Object3D, Quaternion } from "./three.module.js";
import {OBJLoader} from "./OBJLoader.js";
var APP = {

	Player: function (saveImage) {
		
		var saveLink;
		var renderer = new THREE.WebGLRenderer( 
			{ 
				alpha:true, 
				antialias: true,
				preserveDrawingBuffer: saveImage
			} );
		
	
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.outputEncoding = THREE.sRGBEncoding;

		var loader = new THREE.ObjectLoader();
		var texLoader = new THREE.TextureLoader();
		var objLoader = new OBJLoader();
		var camera, scene;
		var controls;
		var vrButton = VRButton.createButton( renderer );
		var orbitObject;
		var animSpeed = 0.8;
		var callbackObject;

		var strDownloadMime = "image/octet-stream";
		var animations = [];
		var dom = document.getElementById( 'globe' );
		dom.appendChild( renderer.domElement );

		this.dom = dom;
		var materialsDict = {
			
		}
		var prefabDict = {};
		var animsFunctions = {
			// "A_WindTurbine05": anim_turbine,
			"A_WindTurbine009": anim_turbine,
			"A_Balloon001": anim_balloon,
			"A_FishingBoat01": anim_boat,
			"A_Cloud14": anim_clouds,
			"A_Cloud13": anim_clouds,
			"A_Bird17": anim_birds,
			"A_Bird16": anim_birds,
			"A_Bird15": anim_birds,
			"A_Whale02": anim_whales,
		};

		var objMaterialMapping = {
			'Globe' : "globe",
			'Mountain01': "mountains",
			'default': "props"

		};

		var rotMat = new THREE.Matrix4();
		rotMat.makeRotationX(Math.PI*0.5);

		var reverseRotMat = new THREE.Matrix4();
		reverseRotMat.getInverse(rotMat);


		var camForward = new THREE.Vector3();
		this.width = 1024;
		this.height = 1024;
		var timer = 0.0;
		var targetRotationSpeed = 1;
		var rotationSpeed = targetRotationSpeed;

		var startRotateTimer = 0.0;

		var skipFrames = 3;
		var amountToLoad = 0;
		var readyToRender = false;
		var waitingForFirstFrame = true;
		var finishedLoadingCallback = function(){};

		if(saveImage){
			init();
		}

	
	
		function finishedLoading()
		{
			readyToRender =true;
		}
		this.loadMaterial = function(texPath){
			var tex = texLoader.load( texPath );
			tex.encoding = THREE.sRGBEncoding;
			var material = new THREE.MeshLambertMaterial({
				
				map: tex,
			

			} );

			 return material;
		}
		this.loadMaterials = function()
		{
			materialsDict["globe"] = this.loadMaterial( 'tex/tex_globe.jpg' );
			materialsDict["mountains"] = this.loadMaterial('tex/tex_mountains.jpg');
			materialsDict["props"] = this.loadMaterial('tex/tex_props.jpg');
		}
		this.load = function ( json, objs, finishedLoading ) 
		{
			finishedLoadingCallback = finishedLoading;
			
			var project = json.project;

			if ( project.vr !== undefined ) renderer.xr.enabled = project.vr;
			if ( project.shadows !== undefined ) renderer.shadowMap.enabled = project.shadows;
			if ( project.shadowType !== undefined ) renderer.shadowMap.type = project.shadowType;
			if ( project.toneMapping !== undefined ) renderer.toneMapping = project.toneMapping;
			if ( project.toneMappingExposure !== undefined ) renderer.toneMappingExposure = project.toneMappingExposure;
			if ( project.physicallyCorrectLights !== undefined ) renderer.physicallyCorrectLights = project.physicallyCorrectLights;
			this.loadMaterials();
			this.setScene( loader.parse( json.scene ) );
			this.setCamera(scene.getObjectByName('PerspectiveCamera',true));
			this.spawnAnimatedObjects(objs);
	
			renderer.shadowMap.enabled = true;
			renderer.shadowMap.type = THREE.PCFSoftShadowMap;


			orbitObject = scene.getObjectByName('OrbitPivot', true);
			
			controls = new OrbitControls( camera, renderer.domElement );
	
			controls.enableDamping = true;// = Math.PI*2;
			controls.enablePan = false;
			controls.enableZoom = false;
			controls.enableKeys = false;
			if(saveImage){
				controls.enabled = false;
			}
			
		};

		this.setCamera = function ( value ) {

			camera = value;
			camera.aspect = this.width / this.height;
			camera.updateProjectionMatrix();

		};
	

		this.setScene = function ( value ) {

			scene = value;

		};

		this.setSize = function ( width, height ) {

			this.width = width;
			this.height = height;

			if ( camera ) {

				camera.aspect = this.width / this.height;
				camera.updateProjectionMatrix();

			}

			if ( renderer ) {

				renderer.setSize( width, height );

			}

		};

		var time, prevTime, delta;
	
		function render()
		{
		
			renderer.render( scene, camera );
			
			if(waitingForFirstFrame)
			{
				
				waitingForFirstFrame = false;
				finishedLoadingCallback();
			}
		}

		function animate() 
		{
			if(!readyToRender){
				return;
			}
			
			time = performance.now();
			delta = time-prevTime;
			
			if(saveImage)
			{
				prevTime = time;
				animateObjects(0);
				render();
				return;
				
			}

			if(prevTime < 0){
				prevTime = performance.now();
				timer = 0;
			}
			
			if(skipFrames > 0)
			{
				--skipFrames
				delta = 0;
			}

			animateObjects(timer);
			render();
			if(controls.update())
			{
				startRotateTimer = 0;
				rotationSpeed = 0.0;
			}
			
			if(startRotateTimer > 0.0){
				startRotateTimer -= delta*0.001;
			}
			else{
				rotateOrbiter(delta);
			}

			timer += delta*animSpeed;
			prevTime = time;

		}

		function spawnFlame(parent){
			var matrix = [0.252393,0,0,0,0,0.487804,0,0,0,0,0.252393,0,0,15.821398,-0.201323,1];
			const geometry = new THREE.SphereBufferGeometry( 1.2, 4, 4);
			const material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
			const sphere = new THREE.Mesh( geometry, material );
			sphere.matrix.fromArray(matrix);
			sphere.matrix.decompose(sphere.position, sphere.quaternion, sphere.scale );
			sphere.matrixAutoUpdate =false;
			parent.add(sphere);
			return sphere;
		}

		function initState(object, name)
		{
			
			object.matrixAutoUpdate =true;
			var state =
			{
				"startPos": object.position.clone(),
				"startRot": object.rotation.clone(),
				"startQuat": object.quaternion.clone(),
				"up": new THREE.Vector3(0,1,0),
				"forward":new THREE.Vector3(0,0,1),
				"right": new THREE.Vector3(1,0,0),
			};
			state.forward.applyQuaternion(state.startQuat);
			state.right.applyQuaternion(state.startQuat);
			state.up.applyQuaternion(state.startQuat);

			if(name.startsWith("A_Balloon001")){
				var sphere = spawnFlame(object);			
				state.child = sphere;
			}
			return state;
		}

		function rotateOrbiter(delta)
		{
			if(rotationSpeed < targetRotationSpeed)
			{
				rotationSpeed += delta*0.01;
				rotationSpeed = Math.min(rotationSpeed, targetRotationSpeed);
			}
			orbitObject.rotateOnAxis(new THREE.Vector3(0,1,0),delta*0.0001*rotationSpeed);
		}

		this.play = function () {

			if ( renderer.xr.enabled ) dom.append( vrButton );

			prevTime = performance.now();
			renderer.setAnimationLoop( animate );

		};

		this.stop = function () {

			if ( renderer.xr.enabled ) vrButton.remove();

			renderer.setAnimationLoop( null );

		};

		this.dispose = function () {

			renderer.dispose();

			camera = undefined;
			scene = undefined;

		};

		function instantiate(prefab, matrix, first)
		{
			//Convert to 4x4
			if(matrix.length == 12){
				matrix.splice(3,0,0.0);
				matrix.splice(7,0,0.0);
				matrix.splice(11,0,0.0);
				matrix.push(1.0);
			}

			var child =first? prefab: prefab.clone();
			const instance = child;
	
			instance.matrix.fromArray(matrix);
			instance.matrix.multiply(rotMat);
			instance.matrix.premultiply(reverseRotMat);
			instance.matrix.decompose(instance.position, instance.quaternion, instance.scale );
			instance.matrixAutoUpdate = false;

			return instance;
		};
		this.loadMesh= function(objName, objMatrices,animFunc, seeds )
		{
			++amountToLoad;
			objLoader.load("./models/"+objName+".obj", function ( mesh ) 
			{
				if(mesh === undefined)
				{
					console.error("mesh with name " + objName + " was not found");
				}
				else
				{
					
					var mat = getMaterial(objName);
					
					mesh.children.forEach(element => {
						element.material = mat
					});
					
					var first = true
					for(var index in objMatrices)
					{
						var seed = seeds[index];
						var instance = instantiate(mesh, objMatrices[index], first);
						scene.add(instance);
						first =false;
						
						if(animFunc != undefined)
						{
							animations.push({ "obj":instance, "initState": initState(instance, objName) , "seed": seed , "func": animFunc});
						}
					}
				}
				--amountToLoad;
				if(amountToLoad === 0)
				{
					finishedLoading();
				}

			}, function(xhr)
			{
				
			}, 
			function(error){
				console.error(error);
				--amountToLoad;
				if(amountToLoad === 0)
				{
					finishedLoading();
				}
			});


		}
		function getMaterial(objName)
		{
			var matName = objMaterialMapping[objName];
			if(matName === undefined){
				matName = objMaterialMapping["default"];
			}
			var mat = materialsDict[matName];
			
			return mat;
		}
		this.spawnAnimatedObjects = function(objects)
		{
			var random = new Mulberry32(12234);
		
			for(var objName in objects)
			{
			
				var animFunc = animsFunctions[objName];
				var objMatrices = objects[objName];
				var seeds = [];
				for(var i in objMatrices){
					seeds.push(random.next());
				}
				this.loadMesh(objName,objMatrices, animFunc, seeds);
			}
			finishedLoading();
		};
		
		function animateObjects(time)
		{
			for(var index in animations)
			{
				var anim = animations[index];
			
				anim.func(anim.obj, anim.initState, anim.seed,time);
			}
		}
		
		function anim_turbine(obj, initState,seed,time)
		{
			
			obj.rotation.z = initState.startRot.z  + seed - time*(0.0010*(seed*0.1+0.95));	
		}

		function anim_balloon(obj, initState,seed,time)
		{
			var tval = (time + seed)*0.0002;
			var height = Math.cos(tval)*6;
			if(initState.child){
			initState.child.visible =  height < 0 && height +Math.sin(time*0.01)*4 < 0;
			}
			obj.position.copy(initState.up);
			obj.position.multiplyScalar(height);
			obj.position.add(initState.startPos);
		}

		function anim_clouds(obj, initState, seed, time){
			obj.quaternion.setFromAxisAngle(initState.forward, Math.sin(((time*0.00001*seed)-0.5+seed))* Math.PI );
			obj.position.copy(initState.startPos);
			obj.position.applyQuaternion(obj.quaternion);
			obj.quaternion.multiply(initState.startQuat);
		}

		function anim_birds(obj, initState, seed, time)
		{
			var dx = time*0.0017*(seed+0.5)*0.5+seed*40;
			var dy = dx*0.75;
			var dz = time*0.0007*seed + seed*20
			var xOffset = Math.sin(dx)*10
			var yOffset = Math.cos(dy)*10
			
			//Rotation
			var rot = -Math.atan2(-Math.cos(dx)*Math.PI, -Math.sin(dy)*Math.PI);
			obj.quaternion.setFromAxisAngle(initState.up, rot);
			obj.quaternion.multiply(initState.startQuat);

			//Position
			obj.position.set(xOffset,Math.cos(dz)*4,yOffset);
			obj.position.applyQuaternion(initState.startQuat);
			obj.position.add(initState.startPos);
	

		}

		var boatQuat = new THREE.Quaternion();
		function anim_boat(obj, initState, seed, time){
		
		
			var rotX = -Math.sin((time + seed*20)*0.001)*0.1;
			var rotZ = -Math.cos((time + seed*10)* 0.002)*0.1;
			obj.quaternion.setFromAxisAngle(initState.right,rotX);
			boatQuat.setFromAxisAngle(initState.forward,rotZ);
			obj.quaternion.multiply(boatQuat);
			obj.quaternion.multiply(initState.startQuat);

			
			obj.position.copy(initState.up);
			obj.position.multiplyScalar(Math.sin((time + seed)*0.002)*0.5);
			obj.position.add(initState.startPos);

		}

		function anim_whales(obj, initState, seed, time)
		{
			
			var rot = (time)*0.0005 -  2*seed*Math.PI;
			var visibility =Math.cos(rot/2)*10 -7;
			
			obj.quaternion.setFromAxisAngle(initState.forward,rot);
			obj.quaternion.multiply(initState.startQuat);
			//obj.quaternion.copy(initState.startQuat);
			obj.visible = visibility > 0;
			obj.position.copy(initState.up);
			
			obj.position.multiplyScalar((Math.cos(rot-0.2)*8 - 8));
	
			obj.position.add(initState.startPos);

		}

		function saveAsImage() {
			var imgData;
	
			try {
				var strMime = "image/png";
				imgData = renderer.domElement.toDataURL(strMime);
	
				saveFile(imgData.replace(strMime, strDownloadMime), "frame.png");
	
			} catch (e) {
				console.log(e);
				return;
			}

			document.body.removeChild(saveLink);
			saveImage = false;
			controls.enabled = true;
		}

		function init() 
		{

			saveLink = document.createElement('div');
			saveLink.style.position = 'absolute';
			saveLink.style.top = '10px';
			saveLink.style.width = '100%';
			saveLink.style.color = 'white !important';
			saveLink.style.textAlign = 'center';
			saveLink.innerHTML =
				'<a href="#" id="saveLink">Save Frame</a>';
			document.body.appendChild(saveLink);
			document.getElementById("saveLink").addEventListener('click', saveAsImage);
		}
		
		var saveFile = function (strData, filename) {
			var link = document.createElement('a');
			if (typeof link.download === 'string') {
				document.body.appendChild(link); //Firefox requires the link to be in the body
				link.download = filename;
				link.href = strData;
				link.click();
				document.body.removeChild(link); //remove the link when done
			} else {
				location.replace(uri);
			}
		}
		function Mulberry32(seed) {
			"use strict";
			return {
				next: function () {
					seed |= 0; seed = seed + 0x6D2B79F5 | 0;
					var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
					t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
					return ((t ^ t >>> 14) >>> 0) / 4294967296;
				}
			};
		}
	}

	

};

export { APP };
