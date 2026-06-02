"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, UserCheck, Check, X, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { FriendUser, Friend, FriendRequest } from "@/lib/types";
import { rollbackOnError } from "@/lib/optimistic";

function getInitials(name: string){
  return name.slice(0, 2).toUpperCase();
}

export default function FriendsPage(){
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const [friendToRemove, setFriendToRemove] = useState<string | null>(null);
  const [justSentIds, setJustSentIds] = useState<Set<string>>(new Set());
  const [justAcceptedIds, setJustAcceptedIds] = useState<Set<string>>(new Set());
  const [justRejectedIds, setJustRejectedIds] = useState<Set<string>>(new Set());

  const { data: friends = [], isLoading: friendsLoading } = useQuery<Friend[]>({
    queryKey: ["friends"],
    queryFn: () => get<Friend[]>("/friends"),
  });

  const { data: receivedRequests = [], isLoading: reqLoading } = useQuery<FriendRequest[]>({
    queryKey: ["friend-requests", "received"],
    queryFn: () => get<FriendRequest[]>("/friends/requests/received"),
  });

  const { data: sentRequests = [] } = useQuery<FriendRequest[]>({
    queryKey: ["friend-requests", "sent"],
    queryFn: () => get<FriendRequest[]>("/friends/requests/sent"),
  });

  const sentIdsSet = React.useMemo(() => {
    const ids = new Set(sentRequests.map((r) => r.receiver.id));
    justSentIds.forEach((id) => ids.add(id));
    return ids;
  }, [sentRequests, justSentIds]);

  const { data: searchResults = [] } = useQuery<FriendUser[]>({
    queryKey: ["friend-search", searchQuery],
    queryFn: () => get<FriendUser[]>(`/friends/search?q=${encodeURIComponent(searchQuery)}`),
    enabled: searchQuery.length >= 2,
  });

  const sendRequest = useMutation({
    mutationFn: (receiverId: string) => api.post("/friends/request", { receiverId }),
    onMutate: (receiverId) => {
      setJustSentIds((prev) => new Set([...prev, receiverId]));
    },
    onSuccess: (_, receiverId) => {
      addToast("Friend request sent", "success");
      queryClient.invalidateQueries({ queryKey: ["friend-requests", "sent"] });
      setActiveTab("requests");
      setSearchQuery("");
      setJustSentIds((prev) => {
        const next = new Set(prev);
        next.delete(receiverId);
        return next;
      });
    },
    onError: (err, receiverId) => {
      setJustSentIds((prev) => {
        const next = new Set(prev);
        next.delete(receiverId);
        return next;
      });
      addToast(extractApiError(err, "Failed to send request"), "error");
    },
  });

  const respondRequest = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: string }) =>
      api.put("/friends/request/respond", { requestId, action }),
    onMutate: async ({ requestId, action }) => {
      if(action === "ACCEPT") setJustAcceptedIds((prev) => new Set([...prev, requestId]));
      if(action === "REJECT") setJustRejectedIds((prev) => new Set([...prev, requestId]));
      const previousFriends = queryClient.getQueryData<Friend[]>(["friends"]) || [];
      const previousReceived = queryClient.getQueryData<FriendRequest[]>(["friend-requests", "received"]) || [];
      const previousSent = queryClient.getQueryData<FriendRequest[]>(["friend-requests", "sent"]) || [];
      if(action === "ACCEPT"){
        const req = previousReceived.find((r) => r.id === requestId);
        if(req){
          const newFriend: Friend = {
            friendshipId: `opt-${Date.now()}`,
            friend: { id: req.sender.id, username: req.sender.username, email: req.sender.email, avatar: req.sender.avatar },
            createdAt: new Date().toISOString(),
          };
          queryClient.setQueryData<Friend[]>(["friends"], (old) => [...(old || []), newFriend]);
        }
      }
      queryClient.setQueryData<FriendRequest[]>(["friend-requests", "received"], (old) => (old || []).filter((r) => r.id !== requestId));
      queryClient.setQueryData<FriendRequest[]>(["friend-requests", "sent"], (old) => (old || []).filter((r) => r.id !== requestId));
      return { previousFriends, previousReceived, previousSent };
    },
    onError: (err, { requestId }, context) => {
      setJustAcceptedIds((prev) => { const next = new Set(prev); next.delete(requestId); return next; });
      setJustRejectedIds((prev) => { const next = new Set(prev); next.delete(requestId); return next; });
      if(context){
        queryClient.setQueryData(["friends"], context.previousFriends);
        queryClient.setQueryData(["friend-requests", "received"], context.previousReceived);
        queryClient.setQueryData(["friend-requests", "sent"], context.previousSent);
      }
      addToast(extractApiError(err, "Failed to respond"), "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
    onSuccess: (_, { requestId, action }) => {
      setTimeout(() => {
        setJustAcceptedIds((prev) => { const next = new Set(prev); next.delete(requestId); return next; });
        setJustRejectedIds((prev) => { const next = new Set(prev); next.delete(requestId); return next; });
      }, 1500);
      if(action === "ACCEPT"){
        addToast("Friend request accepted", "success");
      } else{
        addToast("Friend request rejected", "success");
      }
    },
  });

  const removeFriend = useMutation({
    mutationFn: (friendshipId: string) => api.delete(`/friends/${friendshipId}`),
    onMutate: async (friendshipId) => {
      const previous = queryClient.getQueryData<Friend[]>(["friends"]) || [];
      queryClient.setQueryData<Friend[]>(["friends"], (old) => (old || []).filter((f) => f.friendshipId !== friendshipId));
      return { previous };
    },
    onError: (err, friendshipId, context) => {
      rollbackOnError(queryClient, ["friends"], context);
      addToast(extractApiError(err, "Failed to remove friend"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["friends"] }),
    onSuccess: () => {
      addToast("Friend removed", "success");
    },
  });

  const isLoading = friendsLoading || reqLoading;
  const pendingCount = receivedRequests.length + sentRequests.length;

  if(isLoading){
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-24">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="space-y-4">
          {[0,1,2,3,4].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-7">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            Friends
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your connections</p>
        </div>
      </header>

      <SearchInput
        value={searchQuery}
        onChange={(v) => setSearchQuery(v)}
        placeholder="Search users by username or email..."
        className="w-full"
      />

      {/* Search Results */}
      {searchQuery.length >= 2 ? (
        <motion.div key="search-results" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <p className="text-sm font-bold text-muted-foreground">Search Results</p>
          {searchResults.length === 0 ? (
            <p key="no-search" className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary font-bold text-xs">{getInitials(user.username)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{user.username}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  {sentIdsSet.has(user.id) ? (
                    <span className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-sm font-bold">
                      <Check className="w-4 h-4" /> Sent
                    </span>
                  ) : (
                    <button
                      onClick={() => sendRequest.mutate(user.id)}
                      disabled={sendRequest.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-60"
                    >
                      <UserPlus className="w-5 h-5" /> Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      ) : null}

      {/* Tabs */}
      <div className="flex rounded-xl p-1.5 w-fit shadow-sm bg-card border border-border">
        <button
          onClick={() => setActiveTab("friends")}
          className={cn(
            "px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
            activeTab === "friends" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-accent/50"
          )}
        >
          <Users className="w-4 h-4" /> Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={cn(
            "px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
            activeTab === "requests" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-accent/50"
          )}
        >
          <UserCheck className="w-4 h-4" /> Requests
          {pendingCount > 0 && (
            <span className="ml-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === "friends" ? (
        <div key="friends-tab" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {friends.length > 0 ? friends.map((friend, i) => {
            const otherUser = friend.friend;
            const displayName = otherUser?.username || otherUser?.email?.split("@")[0] || "Unknown";
            const displayEmail = otherUser?.email || "";
            return (
              <motion.div
                key={friend.friendshipId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border p-5 bg-card flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {otherUser?.avatar ? (
                      <img src={otherUser.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-primary font-bold text-sm">{getInitials(displayName)}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{displayName}</p>
                    {displayEmail && <p className="text-sm text-muted-foreground">{displayEmail}</p>}
                  </div>
                </div>
                <button
                  onClick={() => setFriendToRemove(friend.friendshipId)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  aria-label="Remove friend"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            );
          }) : (
            <EmptyState
              image="/empty-friends.png"
              title="No friends yet"
              description="Search for users by username or email to add them."
            />
          )}
        </div>
      ) : activeTab === "requests" ? (
        <div key="requests-tab" className="space-y-8">
          {/* Incoming */}
          <div>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Incoming ({receivedRequests.length})
            </h2>
            <div className="space-y-3">
              {receivedRequests.length > 0 ? receivedRequests.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border p-5 bg-card flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-sky-500/10 flex items-center justify-center overflow-hidden">
                      {req.sender?.avatar ? (
                        <img src={req.sender.avatar} alt="" className="w-full h-full object-cover" />
                      ) : req.sender?.username ? (
                        <span className="text-sky-500 font-bold text-sm">{getInitials(req.sender.username)}</span>
                      ) : (
                        <User className="w-6 h-6 text-sky-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{req.sender?.username || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">Wants to be friends</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {justAcceptedIds.has(req.id) ? (
                      <span className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-sm font-bold">
                        <Check className="w-4 h-4" /> Accepted
                      </span>
                    ) : justRejectedIds.has(req.id) ? (
                      <span className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 text-rose-400 rounded-xl text-sm font-bold">
                        <X className="w-4 h-4" /> Declined
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => respondRequest.mutate({ requestId: req.id, action: "ACCEPT" })}
                          disabled={respondRequest.isPending}
                          className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-bold hover:bg-sky-400 transition-colors active:scale-95 disabled:opacity-60"
                        >
                          <Check className="w-5 h-5" /> Accept
                        </button>
                        <button
                          onClick={() => respondRequest.mutate({ requestId: req.id, action: "REJECT" })}
                          disabled={respondRequest.isPending}
                          className="flex items-center gap-1.5 px-4 py-2 bg-accent text-foreground rounded-xl text-sm font-bold hover:bg-accent/80 transition-colors active:scale-95 disabled:opacity-60"
                        >
                          <X className="w-5 h-5" /> Decline
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )) : (
                <p className="text-sm text-muted-foreground py-2">No incoming friend requests.</p>
              )}
            </div>
          </div>

          {/* Outgoing */}
          <div>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4" /> Outgoing ({sentRequests.length})
            </h2>
            <div className="space-y-3">
              {sentRequests.length > 0 ? sentRequests.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border p-5 bg-card flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-sky-500/10 flex items-center justify-center overflow-hidden">
                      {req.receiver?.avatar ? (
                        <img src={req.receiver.avatar} alt="" className="w-full h-full object-cover" />
                      ) : req.receiver?.username ? (
                        <span className="text-sky-400 font-bold text-sm">{getInitials(req.receiver.username)}</span>
                      ) : (
                        <User className="w-6 h-6 text-sky-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{req.receiver?.username || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">Request {req.status.toLowerCase()}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-base font-bold",
                    req.status === "PENDING" ? "bg-sky-500/10 text-sky-400" :
                    req.status === "ACCEPTED" ? "bg-sky-500/10 text-sky-400" :
                    req.status === "REJECTED" ? "bg-red-500/10 text-red-400" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {req.status}
                  </span>
                </motion.div>
              )) : (
                <p className="text-sm text-muted-foreground py-2">No outgoing friend requests.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={!!friendToRemove}
        onConfirm={() => { if(friendToRemove) removeFriend.mutate(friendToRemove); setFriendToRemove(null); }}
        onCancel={() => setFriendToRemove(null)}
        title="Remove friend?"
        description="Are you sure you want to remove this friend? This action cannot be undone."
        confirmLabel={removeFriend.isPending ? "Removing..." : "Remove"}
        variant="danger"
      />
    </div>
  );
}
