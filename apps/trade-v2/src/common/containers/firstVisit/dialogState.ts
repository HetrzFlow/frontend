interface FirstVisitDialogStateInput {
  hasAcceptedInviteCodeDialog: boolean;
  disabled?: boolean;
}

export function getFirstVisitDialogState({
  hasAcceptedInviteCodeDialog,
  disabled = false,
}: FirstVisitDialogStateInput) {
  return {
    shouldShowFirstVisitDialog: !disabled && !hasAcceptedInviteCodeDialog,
  };
}
