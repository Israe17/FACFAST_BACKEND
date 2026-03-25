export interface TransitionPolicy<TSubject, TTransition extends string> {
  assert_transition_allowed(subject: TSubject, transition: TTransition): void;
}
