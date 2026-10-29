#[test_only]
module wordle_addr::wordle_tests {
    use std::vector;
    use wordle_addr::wordle;

    #[test]
    fun test_evaluate_guess_exact() {
        let solution = b"APPLE";
        let guess = b"APPLE";
        let result = wordle::evaluate_guess(&guess, &solution);

        let i = 0;
        while (i < 5) {
            assert!(*vector::borrow(&result, i) == 2, i);
            i += 1;
        };
    }

    #[test]
    fun test_evaluate_guess_duplicate_letters() {
        let solution = b"APPLE";
        let guess = b"POPPA";
        let result = wordle::evaluate_guess(&guess, &solution);

        assert!(*vector::borrow(&result, 0) == 1, 300);
        assert!(*vector::borrow(&result, 1) == 0, 301);
        assert!(*vector::borrow(&result, 2) == 2, 302);
        assert!(*vector::borrow(&result, 3) == 0, 303);
        assert!(*vector::borrow(&result, 4) == 1, 304);
    }

    #[test]
    fun test_evaluate_guess_partial_and_exact() {
        let solution = b"SMART";
        let guess = b"STARS";
        let result = wordle::evaluate_guess(&guess, &solution);

        assert!(*vector::borrow(&result, 0) == 2, 400);
        assert!(*vector::borrow(&result, 1) == 1, 401);
        assert!(*vector::borrow(&result, 2) == 2, 402);
        assert!(*vector::borrow(&result, 3) == 2, 403);
        assert!(*vector::borrow(&result, 4) == 0, 404);
    }
}
