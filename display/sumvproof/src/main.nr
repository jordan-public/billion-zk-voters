use dep::std;


fn extract_count_params(count_public_inputs: [Field; 99]) -> (u64, Field, Field, [Field; 32], [Field; 32], [Field; 32]) {
    let new_count = count_public_inputs[0] as u64;
    let old_root = count_public_inputs[1];
    let new_root = count_public_inputs[2];
    let mut path : [Field; 32] = [0; 32];
    let mut siblings : [Field; 32] = [0; 32];
    let mut message_hash: [Field; 32] = [0; 32];
    for i in 0..32 {
        path[i] = count_public_inputs[i+3];
        siblings[i] = count_public_inputs[i+35];
        message_hash[i] = count_public_inputs[i+67];
    };
    (new_count, old_root, new_root, path, siblings, message_hash)
}

fn main(
    count_verification_key : [Field; 114], 
    count_proof : [Field; 162], // 63+99=162
    count_public_inputs : [Field; 99], // 1+1+1+32+32+32=
    count_key_hash : Field, 
    input_aggregation_object : [Field; 16],
    count : pub u64,
    message_hash: pub [Field; 32]
) -> pub [Field; 16] {
    let mut aggregation_object = input_aggregation_object;

    let (current_count, _, _, _, _, count_message_hash) = extract_count_params(count_public_inputs);
    assert(count_message_hash == message_hash); // Counting votes for the same candidate (message_hash) in the current count
    assert(count == current_count);
    
    aggregation_object = std::verify_proof(
        count_verification_key.as_slice(), 
        count_proof.as_slice(), 
        count_public_inputs.as_slice(), 
        count_key_hash, 
        aggregation_object);

    let mut output = [0; 16];
    for i in 0..16 {
        output[i] = aggregation_object[i];
    }
    output
}