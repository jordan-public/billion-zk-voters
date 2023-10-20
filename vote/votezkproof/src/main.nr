use dep::std;

fn main(public_key_x : [u8; 32], public_key_y : [u8; 32], signature: [u8; 64], message_hash: pub [u8; 32], address: [u8; 20], nullifier : pub [u8; 32]) {
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