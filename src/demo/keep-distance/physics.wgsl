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
    blub: vec4<f32>
}

@binding(0) @group(0) var<storage, read> particlesA : Particles;
@binding(1) @group(0) var<storage, read_write> particlesB : Particles;
@binding(2) @group(0) var <uniform> myUniform: MyUniform;
@binding(3) @group(0) var distanceTexture: texture_2d<f32>;
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {

	var index = GlobalInvocationID.x;
	var vPos = particlesA.particles[index].pos;
	var vVel = particlesA.particles[index].vel;
	var vForce = particlesA.particles[index].force;
	var pos : vec2<f32>;
	var mouse = myUniform.blub.xy;


	var offset: vec2<f32> = vec2(0);

	// OLD SYSTEM
//	/*
//	for (var i = 0u; i < arrayLength(&particlesA.particles) - 1; i++) {
//		if (i == index) {
//			continue;
//		}
//
//		pos = particlesA.particles[i].pos.xy;
//		var dis = distance(pos, vPos) + 0.0001;
//		var force = ((0.5 - 0.5 * myUniform.blub.w) / myUniform.blub.z) / pow(dis, 2);
//		var vv = (pos - vPos) * force *  0.000000001;
//
//
//		offset += vv;
//	}


    // mouse
    var dis = distance(mouse, vPos) + 0.0001;
    var force = ((0.5 - 0.5 * myUniform.blub.w) / myUniform.blub.z) / pow(dis, 2);
    var vv = (mouse - vPos) * force *  0.00001;

    if (dis > 0.1) {
        //offset += vv;
    } else {
        offset -= vv;
    }


    // distance
	var d = textureLoad(
		distanceTexture,
		vec2i(
		    i32((  vPos.x * 0.5 + 0.5) * 1024.0),
		    i32(((-vPos.y) * 0.5 + 0.5) * 1024.0)
		    ),
		0
	);

	if (d.a > 0.101) {
		// there is another particle near

		var dis = distance(d.xy, vPos) + 0.0001;
		var force = 1 / pow(dis, 2);
		var vv = (d.xy - vPos) * force *  0.000000001;


		vVel -= vv;
        vForce = vec2(1,0);
	} else {
        vForce = vec2(0,1);
	}

	vVel += offset;

    vPos += vVel;
    vVel *= 0.99;
    //vPos *= 0.999;

    // Write back
    particlesB.particles[index].vel = vVel;
	particlesB.particles[index].pos = vPos;
	particlesB.particles[index].force = vForce;

}
