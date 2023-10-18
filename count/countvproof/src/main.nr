use dep::std;

fn main(
    verification_key : [Field; 114], 
    proof : [Field; 4192], 
    public_inputs : [Field; 4129], // 4192-63 
    key_hash : Field, 
    input_aggregation_object : [Field; 16],
    proof_b : [Field; 4192],
) -> pub [Field; 16] {
    let output_aggregation_object_a = std::verify_proof(
        verification_key.as_slice(), 
        proof.as_slice(), 
        public_inputs.as_slice(), 
        key_hash, 
        input_aggregation_object
    );

    let output_aggregation_object = std::verify_proof(
        verification_key.as_slice(),
        proof_b.as_slice(),
        public_inputs.as_slice(),
        key_hash,
        output_aggregation_object_a
    );

    let mut output = [0; 16];
    for i in 0..16 {
        output[i] = output_aggregation_object[i];
    }
    output
}