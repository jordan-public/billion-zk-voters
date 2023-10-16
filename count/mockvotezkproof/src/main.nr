use dep::std;

fn main(junk : Field, pubjunk : pub [Field; 3], pubjunk2: pub Field) {
    assert(junk != 0);
    for i in 0..3 {
        assert(pubjunk[i] != 0);
    }
    assert(pubjunk2 != 0);
}