use dep::std;

global depth = 32;

// ZK friendly sparse tree ZSMT
// To avoid hashing, special values instead of hash: 0 - means empty subtree or leaf
// To avoid hashing h(x,0) and h(0,x) are replaced with x
// WARNING: This tree does not hide the element if there is only one element. To remedy this, add dummy (sentinel) elements to the tree.

// Sparse Merkle Tree membership proof
fn zsmt_member(leaf: Field, root: Field, path: [Field; depth], siblings: [Field; depth]) {
    //let depth = path.len();
    assert(depth == siblings.len());
    let mut current = leaf;
    for i in 0..depth {
        let is_right = (path[i] == 1) as bool;
        let (left, right) = if is_right {
            (siblings[i], current)
        } else {
            (current, siblings[i])
        };
        // if (siblings[i] == 0) current = current; // stays unchanged; current replaces h(0, current) and/or h(current, 0) this is most of the time
        if (siblings[i] != 0) {
            current = std::hash::poseidon::bn254::hash_2([left, right]);
        }
    };
    assert(current == root);
}

// Proof that after adding leaf to the ZSMT with old_root, the new ZSMT is new_root and the path of the leaf is newPath
// Note that both path and siblings are the same for the old and the new ZSMT. This assures the single leaf insertion.
fn zsmt_insert(leaf: Field, old_root: Field, new_root: Field, path: [Field; depth], siblings: [Field; depth]) {
    //let depth = path.len();
    assert(depth == siblings.len());
    let mut old_current = 0; // Was not there before
    let mut new_current = leaf; // Was added
    for i in 0..depth {
        let is_right = (path[i] == 1) as bool;
        let (oldLeft, oldRight, newLeft, newRight) = if is_right {
            (siblings[i], old_current, siblings[i], new_current)
        } else {
            (old_current, siblings[i], new_current, siblings[i])
        };
        // if (siblings[i] == 0) current = current; // stays unchanged; current replaces h(0, current) and/or h(current, 0) this is most of the time
        if (siblings[i] != 0) {
            old_current = std::hash::poseidon::bn254::hash_2([oldLeft, oldRight]);
            new_current = std::hash::poseidon::bn254::hash_2([newLeft, newRight]);
        }
    };
    assert(old_current == old_root);
    assert(new_current == new_root);
}

fn extract__vote_params(vote_public_inputs: [Field; 64]) -> ([Field; 32], [Field; 32]) {
    let mut message_hash: [Field;32] = [0; 32];
    let mut nullifier: [Field; 32] = [0; 32];
    for i in 0..32 {
        message_hash[i] = vote_public_inputs[i];
        nullifier[i] = vote_public_inputs[i+32];
    };
    (message_hash, nullifier)
}

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
    prev_count_proof : [Field; 162], // 63+99=162
    prev_count_public_inputs : [Field; 99], // 1+1+1+32+32+32=
    count_key_hash : Field, 
    vote_verification_key : [Field; 114], 
    vote_key_hash : Field, 
    vote_proof : [Field; 127], // 63+64=127
    vote_public_inputs : [Field; 64], // 32+32=64
    input_aggregation_object : [Field; 16],
    new_count : pub u64,
    old_root: pub Field,
    new_root: pub Field,
    path: pub [Field; 32],
    siblings: pub [Field; 32],
    message_hash: pub [Field; 32]
) -> pub [Field; 16] {
    let mut aggregation_object = input_aggregation_object;

    aggregation_object = std::verify_proof(
        vote_verification_key.as_slice(),
        vote_proof.as_slice(),
        vote_public_inputs.as_slice(),
        vote_key_hash,
        aggregation_object
    );

    let (vote_message_hash, nullifier) = extract__vote_params(vote_public_inputs);
    let (prev_new_count, _, prev_new_root, _, _, prev_message_hash) = extract_count_params(prev_count_public_inputs);
    assert(vote_message_hash == message_hash); // Counting votes for the same candidate (message_hash)
    assert(prev_message_hash == message_hash); // Counting votes for the same candidate (message_hash) in the previous count
    assert(prev_new_count + 1 == new_count); // Counting votes for the next count
    assert(prev_new_root == old_root); // The old root of the previous count is the old root of the current count

    let mut leaf : Field = nullifier[0];
    for i in 1..32 {
        leaf = std::hash::poseidon::bn254::hash_2([leaf, nullifier[i]]);
    }

    if (new_count == 1) { // Ignore previous count and just check the vote
        assert(old_root == 0);
        assert(new_root == leaf);
        zsmt_insert(leaf, old_root, new_root, path, siblings);
    } else { // Recursively count the votes
        zsmt_insert(leaf, old_root, new_root, path, siblings);
        aggregation_object = std::verify_proof(
            count_verification_key.as_slice(), 
            prev_count_proof.as_slice(), 
            prev_count_public_inputs.as_slice(), 
            count_key_hash, 
            aggregation_object
        );
    }

    let mut output = [0; 16];
    for i in 0..16 {
        output[i] = aggregation_object[i];
    }
    output
}

#[test]
fn test_zsmt_member() {

    // Test 1: empty tree - as expected - no hashing at all (otherwise it would be h(0, leaf), h(h(0, leaf), 0), etc.)
    zsmt_member(0, 0, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    // The assertion is inside the function zsmt_member

    // Test 2: one leaf tree - as expected - no hashing at all (otherwise it would be h(1, leaf), h(h(0, leaf), 1), etc.)
    zsmt_member(1, 1, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
}
