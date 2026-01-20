import React, { useState } from "react";

import type { Invitation, Member } from "../data/schema";
import useDialogState from "~/hooks/use-dialog-state";

type UsersDialogType =
  | "invite"
  | "edit-profile"
  | "deactivate"
  | "reactivate"
  | "assign-units"
  | "view-invitations";

type UsersContextType = {
  open: UsersDialogType | null;
  setOpen: (str: UsersDialogType | null) => void;
  currentMember: Member | null;
  setCurrentMember: React.Dispatch<React.SetStateAction<Member | null>>;
  currentInvitation: Invitation | null;
  setCurrentInvitation: React.Dispatch<React.SetStateAction<Invitation | null>>;
};

const UsersContext = React.createContext<UsersContextType | null>(null);

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<UsersDialogType>(null);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [currentInvitation, setCurrentInvitation] = useState<Invitation | null>(
    null,
  );

  return (
    <UsersContext
      value={{
        open,
        setOpen,
        currentMember,
        setCurrentMember,
        currentInvitation,
        setCurrentInvitation,
      }}
    >
      {children}
    </UsersContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUsers = () => {
  const usersContext = React.useContext(UsersContext);

  if (!usersContext) {
    throw new Error("useUsers has to be used within <UsersContext>");
  }

  return usersContext;
};
