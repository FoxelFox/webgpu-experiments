
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec4<f32>
}

struct MyUniform {
    view: mat4x4<f32>,
    blub: vec4<f32>
}

@binding(0) @group(0) var <uniform> myUniform: MyUniform;

@vertex
fn vert_main(
    @builtin(instance_index) instanceIdx : u32,
    @location(0) position : vec4<f32>,
    @location(1) velocity : vec4<f32>,
    @location(2) force : vec4<f32>,
    @location(3) pPos : vec2<f32>
) -> VertexOutput {

    var output : VertexOutput;
    output.position = myUniform.view * vec4<f32>(position.xy + pPos, 0.0, 1.0) ;
    //output.color = vec4(normalize(velocity.xy) * 0.5 + 0.5, pow(length(velocity.xy) * 100, 0.1), 1.0);
    var len = pow(length(velocity.xy) * 150,3)+0.05;
	output.color = vec4(1-len, len - 0.4,len/1.5 + 0.2,1.0) + 0;
  return output;
}

@fragment
fn frag_main(
	@location(0) color : vec4<f32>
) -> @location(0) vec4<f32> {
  return color;
}
