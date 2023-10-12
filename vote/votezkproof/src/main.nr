use dep::std::ecdsa_secp256k1;

fn main(_public_key_x : [u8; 32], _public_key_y : [u8; 32], _signature: [u8; 64], _message_hash: [u8; 32]) {
    let ok = ecdsa_secp256k1::verify_signature(_public_key_x, _public_key_y, _signature, _message_hash);
    assert(ok);
}

// #[test]
// fn test_main() {
//     main(1, 2);

//     // Uncomment to make test fail
//     // main(1, 1);
// }
