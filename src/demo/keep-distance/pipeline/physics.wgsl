struct Particle {
	pos : vec2<f32>,
	vel: vec2<f32>,
	force: vec2<f32>
}

struct Particles {
	particles : array<Particle>,
}

struct Cell {
	midpoint: vec2<f32>,
	mass: f32
}

struct Grid {
	resolution: vec2<f32>,
	cells: array <Cell>
}


struct MyUniform {
	view: mat4x4<f32>,
	blub: vec4<f32>,
	textureSize: f32
}

@binding(0) @group(0) var<storage, read> particlesA : Particles;
@binding(1) @group(0) var<storage, read_write> particlesB : Particles;
@binding(2) @group(0) var <uniform> myUniform: MyUniform;
@binding(3) @group(0) var distanceTexture: texture_2d<f32>;
@binding(4) @group(0) var edges: texture_3d<f32>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {

	var index = GlobalInvocationID.x;
	var vPos = particlesA.particles[index].pos;
	var vVel = particlesA.particles[index].vel;
	var vForce = particlesA.particles[index].force;
	var pos : vec2<f32>;
	var mouse = myUniform.blub.xy;
	var offset: vec2<f32> = vec2(0);

	// edges
	var eX = i32(index % 256);
	var eY = i32(index / 256);


	for (var i = 0i; i < 32; i++) {
        var edge = textureLoad(edges, vec3i(i, eX, eY), 0);
        if (edge.z > 0.1) {

            var ePos = particlesA.particles[i32(edge.y * 256 + edge.x)].pos;



            var dis = distance(ePos, vPos) + 0.01;
            var force = 1 / pow(dis, 1.1);
            var vv = ePos - vPos;

            //if (dis > 0.05) {
              vPos += vv * 0.0001;
            //} else {

              // vPos -= vv * 0.001;
               //vVel *= 0.98;
           //}
        }
	}


	// mouse

	var dis = distance(mouse, vPos);
	var vv = (mouse - vPos);

	if (dis > 0.025) {
		//offset += vv * 1.1;
	} else {

		//offset -= vv  * 100;
		vPos -=  normalize(mouse - vPos) * (0.025 - dis);
	}

	// distance
	var d = textureLoad(
		distanceTexture,
		vec2i(
			i32((  vPos.x * 0.5 + 0.5) * myUniform.textureSize),
			i32(((-vPos.y) * 0.5 + 0.5) * myUniform.textureSize)
			),
		0
	);



	if (d.a > 0.101) {
		// there is another particle near
		var count = (d.a * 10 -1);
		var pos = (d.xy - vPos) / count;
		var dis = distance(pos, vPos) + 0.0001;
		var force = 1 / pow(dis, 1.1);
		var vv = normalize(pos - vPos) * 0.0000001 * force;
		//offset -= vv;
		//vVel *= 0.5;
	} else {
		//vVel *= 0.95;
	}



	vVel += offset;
	vForce = offset;

	vPos += vVel;

    //vVel *= 0.95;

	//if (distance(vec2(0),vPos) > 1) {
	//	vVel += vec2(0) - vPos * 0.001;
	//}


	// Debug
	var firstEdge = textureLoad(edges, vec3i(0, eX, eY), 0);
	var firstPos = particlesA.particles[i32(firstEdge.y * 256 + firstEdge.x)].pos;

	// Write back
	particlesB.particles[index].vel = vVel;
	particlesB.particles[index].pos = vPos;
	particlesB.particles[index].force = firstEdge.xy /256 ;

}