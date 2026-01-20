import { useUploadFiles } from "@better-upload/client";

import { UploadDropzone } from "@acme/ui/custom/upload-dropzone";

export function Uploader() {
  const { control } = useUploadFiles({
    route: "images",
    api: `${import.meta.env.PUBLIC_SERVER_URL}/api/upload`,
    credentials: "include",
  });

  return (
    <UploadDropzone
      control={control}
      accept="image/*"
      description={{
        maxFiles: 4,
        maxFileSize: "5MB",
        fileTypes: "JPEG, PNG, GIF",
      }}
    />
  );
}
