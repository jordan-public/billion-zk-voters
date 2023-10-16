use dep::std;

fn main(junk : Field, pubjunk : pub [Field; 3]) {
    assert(junk != 0);
    for i in 0..3 {
        assert(pubjunk[i] != 0);
    }
}