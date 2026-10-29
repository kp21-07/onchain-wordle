#[test_only]
module wordle_addr::wordle_tests {
    use std::vector;
    use wordle_addr::wordle;

    #[test(admin = @wordle_addr, player = @0x123)]
    fun test_game_flow(admin: &signer, player: &signer) {
        // 1. Initialize Wordle with "SMART"
        let solution = b"SMART";
        wordle::initialize(admin, solution);

        // 2. Player starts game
        wordle::start_game(player);
        assert!(wordle::has_game(@0x123), 100);

        // Check initial state
        let (is_solved, attempts_count, max_attempts) = wordle::get_player_status(@0x123);
        assert!(!is_solved, 101);
        assert!(attempts_count == 0, 102);
        assert!(max_attempts == 6, 103);

        // 3. Submit first guess: "STARS"
        // 'S' (pos 0) -> Exact (2)
        // 'T' (pos 1) -> Partial (1) [T is at pos 4 in SMART]
        // 'A' (pos 2) -> Exact (2)
        // 'R' (pos 3) -> Exact (2)
        // 'S' (pos 4) -> None (0) [First S is exact, SMART only has one S]
        wordle::submit_guess(player, b"STARS");

        let (solved_after_1, count_1, _) = wordle::get_player_status(@0x123);
        assert!(!solved_after_1, 104);
        assert!(count_1 == 1, 105);

        let (word_1, result_1) = wordle::get_attempt_at(@0x123, 0);
        assert!(word_1 == b"STARS", 106);
        assert!(*vector::borrow(&result_1, 0) == wordle::get_match_exact(), 107);
        assert!(*vector::borrow(&result_1, 1) == wordle::get_match_partial(), 108);
        assert!(*vector::borrow(&result_1, 2) == wordle::get_match_exact(), 109);
        assert!(*vector::borrow(&result_1, 3) == wordle::get_match_exact(), 110);
        assert!(*vector::borrow(&result_1, 4) == wordle::get_match_none(), 111);

        // 4. Submit correct word: "SMART"
        wordle::submit_guess(player, b"SMART");
        let (solved_after_2, count_2, _) = wordle::get_player_status(@0x123);
        assert!(solved_after_2, 112);
        assert!(count_2 == 2, 113);
    }

    #[test]
    fun test_evaluate_guess_exact() {
        let solution = b"APPLE";
        let guess = b"APPLE";
        let result = wordle::evaluate_guess(&guess, &solution);
        let i = 0;
        while (i < 5) {
            assert!(*vector::borrow(&result, i) == wordle::get_match_exact(), 200 + i);
            i = i + 1;
        };
    }

    #[test]
    fun test_evaluate_guess_duplicate_letters() {
        // Solution: APPLE (A:1, P:2, L:1, E:1)
        // Guess:    POPPA (P, O, P, P, A)
        // Pos 0: P -> Partial (1)
        // Pos 1: O -> None (0)
        // Pos 2: P -> Exact (2)
        // Pos 3: P -> None (0)
        // Pos 4: A -> Partial (1)
        let solution = b"APPLE";
        let guess = b"POPPA";
        let result = wordle::evaluate_guess(&guess, &solution);

        assert!(*vector::borrow(&result, 0) == wordle::get_match_partial(), 300);
        assert!(*vector::borrow(&result, 1) == wordle::get_match_none(), 301);
        assert!(*vector::borrow(&result, 2) == wordle::get_match_exact(), 302);
        assert!(*vector::borrow(&result, 3) == wordle::get_match_none(), 303);
        assert!(*vector::borrow(&result, 4) == wordle::get_match_partial(), 304);
    }

    #[test(admin = @wordle_addr, player = @0x123)]
    #[expected_failure(abort_code = 65540, location = wordle_addr::wordle)] // INVALID_ARGUMENT | EINVALID_WORD_LENGTH = 4
    fun test_invalid_guess_length(admin: &signer, player: &signer) {
        wordle::initialize(admin, b"SMART");
        wordle::start_game(player);
        wordle::submit_guess(player, b"LONGWORD");
    }
}
