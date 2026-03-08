use automerge::{Automerge, ObjType, ReadDoc, transaction::Transactable, ROOT};

fn main() {
    let mut doc1 = Automerge::new();
    let mut tx1 = doc1.transaction();
    let text_id = tx1.put_object(ROOT, "content", ObjType::Text).unwrap();
    tx1.splice_text(&text_id, 0, 0, "Hello").unwrap();
    tx1.commit();

    let mut doc2 = doc1.clone();

    let mut tx1 = doc1.transaction();
    let len1 = tx1.length(&text_id);
    tx1.splice_text(&text_id, 0, len1 as isize, "Hello World").unwrap();
    tx1.commit();

    let mut tx2 = doc2.transaction();
    let len2 = tx2.length(&text_id);
    tx2.splice_text(&text_id, 0, len2 as isize, "Hello there").unwrap();
    tx2.commit();

    doc1.merge(&mut doc2).unwrap();
    println!("Merged: {}", doc1.text(&text_id).unwrap());
}
