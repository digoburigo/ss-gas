import { UsersDeactivateDialog } from "./users-deactivate-dialog";
import { UsersEditProfileDialog } from "./users-edit-profile-dialog";
import { UsersInviteDialog } from "./users-invite-dialog";
import { UsersReactivateDialog } from "./users-reactivate-dialog";
import { UsersAssignUnitsDialog } from "./users-assign-units-dialog";
import { useUsers } from "./users-provider";

export function UsersDialogs() {
  const { open, setOpen, currentMember, setCurrentMember } = useUsers();

  const handleCloseDialog = () => {
    setOpen(null);
    setTimeout(() => {
      setCurrentMember(null);
    }, 500);
  };

  return (
    <>
      <UsersInviteDialog
        key="user-invite"
        open={open === "invite"}
        onOpenChange={(isOpen) => {
          if (!isOpen) setOpen(null);
        }}
      />

      {currentMember && (
        <>
          <UsersEditProfileDialog
            key={`user-edit-${currentMember.id}`}
            open={open === "edit-profile"}
            onOpenChange={(isOpen) => {
              if (!isOpen) handleCloseDialog();
            }}
            member={currentMember}
          />

          <UsersDeactivateDialog
            key={`user-deactivate-${currentMember.id}`}
            open={open === "deactivate"}
            onOpenChange={(isOpen) => {
              if (!isOpen) handleCloseDialog();
            }}
            member={currentMember}
          />

          <UsersReactivateDialog
            key={`user-reactivate-${currentMember.id}`}
            open={open === "reactivate"}
            onOpenChange={(isOpen) => {
              if (!isOpen) handleCloseDialog();
            }}
            member={currentMember}
          />

          <UsersAssignUnitsDialog
            key={`user-assign-units-${currentMember.id}`}
            open={open === "assign-units"}
            onOpenChange={(isOpen) => {
              if (!isOpen) handleCloseDialog();
            }}
            member={currentMember}
          />
        </>
      )}
    </>
  );
}
