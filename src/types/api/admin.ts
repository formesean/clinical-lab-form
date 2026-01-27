import type { ProfileDTO } from "@/types/api/auth";

export type PendingProfilesResponse = {
  pending: ProfileDTO[];
};

export type ApproveUserResponse = {
  profile: ProfileDTO;
};

export type RejectUserResponse = {
  profile: ProfileDTO;
};
