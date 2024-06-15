struct VertexInput {
    @location(0) position : vec3<f32>
};

struct VertexOutput {
    @builtin(position) position : vec4<f32>
};

@vertex
fn vert_main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4<f32>(input.position, 1.0);
    return output;
}

@fragment
fn frag_main() -> @location(0) vec4<f32> {
    return vec4<f32>(0.0, 0.6, 0.2, 1.0);
}