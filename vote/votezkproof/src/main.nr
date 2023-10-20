use dep::std;

// This solution uses the Noir library implementation of "compute_merkle_root" and "hash_to_field.
// Alternatively my own implementation of merkle tree can be used - see ../../count/countvproof/src/main.nr for this implementation.

fn main(public_key_x : [u8; 32], public_key_y : [u8; 32], signature: [u8; 64], message_hash: pub [u8; 32], address: [u8; 20], nullifier : pub [u8; 32]) {
// // WARNING, IMPORTANT!:
// // Uncomment the following lines and comment the line above to verify the Merkle proof of ballot existence. This is commented for simplification of the demo.
// fn main(public_key_x : [u8; 32], public_key_y : [u8; 32], signature: [u8; 64], message_hash: pub [u8; 32], address: [u8; 20], nullifier : pub [u8; 32],
//     ballot_root: Field, ballot_path: Field, ballot_siblings: [Field; 32]) {
//     // Verify Merkle proof that address is in the ballot tree. The ballot is effectively a hash of the address.
//     let mut addressAsFieldArray : [Field; 20] = [0; 20];
//     for i in 0..20 { addressAsFieldArray[i] = address[i] as Field; }
//     let mut ballot = std::hash::hash_to_field(addressAsFieldArray);
//     assert(std::merkle::compute_merkle_root(ballot, ballot_path, ballot_siblings) == ballot_root); // Address is in the ballot tree

    // Verify signature of the vote. The vote is signed by the voter's private key.
    // The message is keccak256('\x19Ethereum Signed Message:\n' + toSign.length.toString() + toSign),
    // where toSign is issue + vote.toString.
    // Vote itself is a number from 0 to n-1 (n is the number of candidates).
    let ok = std::ecdsa_secp256k1::verify_signature(public_key_x, public_key_y, signature, message_hash);
    assert(ok);

    // Concatenate public_key_x and public_key_y into pubKey : [u8; 64]
    let mut pubKey : [u8; 64] = [0; 64];
    for i in 0..32 {
        pubKey[i] = public_key_x[i];
        pubKey[i+32] = public_key_y[i];
    }

    // Verify address matches the public key
    let hash : [u8; 32] = std::hash::keccak256(pubKey, 64);
    for i in 1..20 {
        assert(hash[12+i] == address[i]);
    }

    // Check nullifier
    let calculatedNullfier : [u8; 32] = std::hash::keccak256(signature, 64);
    for i in 0..32 {
        assert(nullifier[i] == calculatedNullfier[i]);
    }
}