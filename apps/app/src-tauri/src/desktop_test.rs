use super::*;
use std::fs;

#[test]
fn test_build_tree_recursive_desktop() {
    // Create a temporary directory structure
    let temp_dir = std::env::temp_dir().join("cherit_test_tree");
    if temp_dir.exists() {
        fs::remove_dir_all(&temp_dir).unwrap();
    }
    fs::create_dir_all(&temp_dir).unwrap();

    // Create structure:
    // root/
    //   file1.md
    //   file2.txt (should be ignored)
    //   dir1/
    //     subfile1.md
    //   dir2/ (empty)
    //   .hidden/
    //     hidden.md (should be ignored)

    fs::write(temp_dir.join("file1.md"), "content").unwrap();
    fs::write(temp_dir.join("file2.txt"), "content").unwrap();

    let dir1 = temp_dir.join("dir1");
    fs::create_dir(&dir1).unwrap();
    fs::write(dir1.join("subfile1.md"), "content").unwrap();

    let dir2 = temp_dir.join("dir2");
    fs::create_dir(&dir2).unwrap();

    let hidden = temp_dir.join(".hidden");
    fs::create_dir(&hidden).unwrap();
    fs::write(hidden.join("hidden.md"), "content").unwrap();

    // Run the function
    let nodes = build_tree_recursive_desktop(temp_dir.to_str().unwrap()).unwrap();

    // Verify results
    assert_eq!(nodes.len(), 3); // file1.md, dir1, dir2

    // Helper to find node by name
    let find_node = |name: &str| nodes.iter().find(|n| n.name == name);

    let file1 = find_node("file1").expect("file1 not found");
    assert!(!file1.is_directory);
    assert_eq!(file1.children.len(), 0);

    let dir1_node = find_node("dir1").expect("dir1 not found");
    assert!(dir1_node.is_directory);
    assert_eq!(dir1_node.children.len(), 1);
    assert_eq!(dir1_node.children[0].name, "subfile1");

    let dir2_node = find_node("dir2").expect("dir2 not found");
    assert!(dir2_node.is_directory);
    assert_eq!(dir2_node.children.len(), 0);

    assert!(find_node(".hidden").is_none());
    assert!(find_node("file2").is_none());

    // Cleanup
    fs::remove_dir_all(&temp_dir).unwrap();
}
