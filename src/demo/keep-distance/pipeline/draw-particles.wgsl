
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) @interpolate(flat) id: vec4<u32>

}

struct MyUniform {
    view: mat4x4<f32>,
    blub: vec4<f32>
}

@binding(0) @group(0) var <uniform> myUniform: MyUniform;
@binding(1) @group(0) var colors: texture_2d<f32>;

@vertex
fn vert_main(
    @builtin(instance_index) instanceIdx: u32,
    @location(0) position: vec4<f32>,
    @location(1) velocity: vec4<f32>,
    @location(2) force: vec4<f32>,
    @location(3) pPos: vec2<f32>
) -> VertexOutput {

    var output: VertexOutput;
    output.position = myUniform.view * vec4<f32>(position.xy + pPos, 0.0, 1.0) ;
    //output.color = vec4(normalize(velocity.xy) * 0.5 + 0.5,length(velocity.xy) * 100 ,2.5 - (1 / pow(myUniform.blub.z, -0.115)));

    var color = textureLoad(
		colors,
		vec2i(vec2(instanceIdx % 256,instanceIdx / 256)),
		0
	);

    output.color = color;
    output.id.x = instanceIdx;
    return output;
}

struct FragmentOutput {
	@location(0) color: vec4<f32>,
	@location(1) id: vec4<u32>
}

@fragment
fn frag_main(in: VertexOutput) -> FragmentOutput {
	var output : FragmentOutput;

    output.color = in.color;
	output.id.x = in.id.x;

    return output;
}
