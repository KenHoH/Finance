"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, UserCheck, Check, X, User, MoreVertical, Search, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, api, extractApiError } from "@/lib/api";
import { useToastStore } from "@/store/useToastStore";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { FriendUser, Friend, FriendRequest } from "@/lib/types";

function getInitials(name: string){
  return name.slice(0, 2).toUpperCase();
}

export default function FriendsPage(){
  const addToast = useToastStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const [friendToRemove, setFriendToRemove] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [justSentIds, setJustSentIds] = useState<Set<string>>(new Set());
  const [justAcceptedIds, setJustAcceptedIds] = useState<Set<string>>(new Set());
  const [justRejectedIds, setJustRejectedIds] = useState<Set<string>>(new Set());

  const { data: summary, isLoading: summaryLoading } = useQuery<{friends: Friend[]; receivedRequests: FriendRequest[]; sentRequests: FriendRequest[]}>({
    queryKey: ["friends", "summary"],
    queryFn: () => get<{friends: Friend[]; receivedRequests: FriendRequest[]; sentRequests: FriendRequest[]}>("/friends/summary"),
  });

  const friends = summary?.friends || [];
  const receivedRequests = useMemo(() => summary?.receivedRequests || [], [summary]);
  const sentRequests = useMemo(() => summary?.sentRequests || [], [summary]);

  useEffect(() =>{
    function handleClick(e: MouseEvent){
      if(menuRef.current && !menuRef.current.contains(e.target as Node)){
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const shownPendingToastRef = useRef(false);
  useEffect(() =>{
    if(receivedRequests.length > 0 && !shownPendingToastRef.current){
      shownPendingToastRef.current = true;
      addToast("You have " + receivedRequests.length + " pending friend request" + (receivedRequests.length > 1 ? "s" : "") + ". Check the Requests tab.", "info");
    }
  }, [receivedRequests, addToast]);

  const sentIdsSet = React.useMemo(() => {
    const ids = new Set(sentRequests.map((r) => r.receiver.id));
    justSentIds.forEach((id) => ids.add(id));
    return ids;
  }, [sentRequests, justSentIds]);

  const { data: searchResults = [], isLoading: searchLoading } = useQuery<FriendUser[]>({
    queryKey: ["friend-search", searchQuery],
    queryFn: () => get<FriendUser[]>(`/friends/search?q=${encodeURIComponent(searchQuery)}`),
    enabled: searchQuery.length >= 2 && showAddModal,
  });

  const sendRequest = useMutation({
    mutationFn: (receiverId: string) => api.post("/friends/request", { receiverId }),
    onMutate: (receiverId) => {
      setJustSentIds((prev) => new Set([...prev, receiverId]));
    },
    onSuccess: (_, receiverId) => {
      addToast("Friend request sent", "success");
      queryClient.invalidateQueries({ queryKey: ["friends", "summary"] });
      setActiveTab("requests");
      setSearchQuery("");
      setShowAddModal(false);
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
      const previousSummary = queryClient.getQueryData<{friends: Friend[]; receivedRequests: FriendRequest[]; sentRequests: FriendRequest[]}>(["friends", "summary"]);
      if(action === "ACCEPT" && previousSummary){
        const req = previousSummary.receivedRequests.find((r) => r.id === requestId);
        if(req){
          const newFriend: Friend = {
            friendshipId: `opt-${Date.now()}`,
            friend: { id: req.sender.id, username: req.sender.username, email: req.sender.email, avatar: req.sender.avatar },
            createdAt: new Date().toISOString(),
          };
          queryClient.setQueryData(["friends", "summary"], {
            ...previousSummary,
            friends: [...previousSummary.friends, newFriend],
            receivedRequests: previousSummary.receivedRequests.filter((r) => r.id !== requestId),
            sentRequests: previousSummary.sentRequests.filter((r) => r.id !== requestId),
          });
        }
      } else if(previousSummary){
        queryClient.setQueryData(["friends", "summary"], {
          ...previousSummary,
          receivedRequests: previousSummary.receivedRequests.filter((r) => r.id !== requestId),
          sentRequests: previousSummary.sentRequests.filter((r) => r.id !== requestId),
        });
      }
      return { previousSummary };
    },
    onError: (err, { requestId }, context) => {
      setJustAcceptedIds((prev) => { const next = new Set(prev); next.delete(requestId); return next; });
      setJustRejectedIds((prev) => { const next = new Set(prev); next.delete(requestId); return next; });
      if(context?.previousSummary){
        queryClient.setQueryData(["friends", "summary"], context.previousSummary);
      }
      addToast(extractApiError(err, "Failed to respond"), "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["friends", "summary"] });
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
      const previous = queryClient.getQueryData<{friends: Friend[]; receivedRequests: FriendRequest[]; sentRequests: FriendRequest[]}>(["friends", "summary"]);
      if(previous){
        queryClient.setQueryData(["friends", "summary"], {
          ...previous,
          friends: previous.friends.filter((f) => f.friendshipId !== friendshipId),
        });
      }
      return { previous };
    },
    onError: (err, friendshipId, context) => {
      if(context?.previous){
        queryClient.setQueryData(["friends", "summary"], context.previous);
      }
      addToast(extractApiError(err, "Failed to remove friend"), "error");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["friends", "summary"] }),
    onSuccess: () => {
      addToast("Friend removed", "success");
    },
  });

  const isLoading = summaryLoading;

  if(isLoading){
    return (
      <div className="space-y-7 max-w-7xl mx-auto pb-24">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0,1,2,3,4,5].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const pendingCount = receivedRequests.length;

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            Friends
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {friends.length} friend{friends.length !== 1 ? "s" : ""} &bull; {pendingCount} pending request{pendingCount !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity active:scale-95"
        >
          <UserPlus className="w-4 h-4" /> Add Friend
        </button>
      </header>

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
          {receivedRequests.length > 0 && (
            <span className="ml-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
              {receivedRequests.length}
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
                className="rounded-xl border border-border p-6 bg-card flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10 relative group"
              >
                {/* 3-dot menu */}
                <div className="absolute top-4 right-4" ref={activeMenuId === friend.friendshipId ? menuRef : undefined}>
                  <button
                    onClick={() => setActiveMenuId(activeMenuId === friend.friendshipId ? null : friend.friendshipId)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                    aria-label="Friend options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {activeMenuId === friend.friendshipId && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden"
                      >
                        <button
                          onClick={() => { setFriendToRemove(friend.friendshipId); setActiveMenuId(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <X className="w-4 h-4" /> Remove
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-4 ring-2 ring-primary/20">
                  {otherUser?.avatar ? (
                    <img src={otherUser.avatar} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary font-bold text-lg">{getInitials(displayName)}</span>
                  )}
                </div>
                <p className="font-bold text-foreground text-lg">{displayName}</p>
                {displayEmail && <p className="text-sm text-muted-foreground mt-1">{displayEmail}</p>}
                <p className="text-xs text-muted-foreground mt-3 uppercase tracking-wider font-semibold">Friend</p>
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
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Incoming ({receivedRequests.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {receivedRequests.length > 0 ? receivedRequests.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border p-6 bg-card flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10"
                >
                  <div className="w-20 h-20 rounded-full bg-sky-500/10 flex items-center justify-center overflow-hidden mb-4 ring-2 ring-sky-500/20">
                    {req.sender?.avatar ? (
                      <img src={req.sender.avatar} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : req.sender?.username ? (
                      <span className="text-sky-500 font-bold text-lg">{getInitials(req.sender.username)}</span>
                    ) : (
                      <User className="w-8 h-8 text-sky-500" />
                    )}
                  </div>
                  <p className="font-bold text-foreground text-lg">{req.sender?.username || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">Wants to be friends</p>

                  <div className="flex gap-2 w-full">
                    {justAcceptedIds.has(req.id) ? (
                      <span className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-sm font-bold">
                        <Check className="w-4 h-4" /> Accepted
                      </span>
                    ) : justRejectedIds.has(req.id) ? (
                      <span className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-500/10 text-rose-400 rounded-xl text-sm font-bold">
                        <X className="w-4 h-4" /> Declined
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => respondRequest.mutate({ requestId: req.id, action: "ACCEPT" })}
                          disabled={respondRequest.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-sky-500 text-white rounded-xl text-sm font-bold hover:bg-sky-400 transition-colors active:scale-95 disabled:opacity-60"
                        >
                          <Check className="w-4 h-4" /> Accept
                        </button>
                        <button
                          onClick={() => respondRequest.mutate({ requestId: req.id, action: "REJECT" })}
                          disabled={respondRequest.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-accent text-foreground rounded-xl text-sm font-bold hover:bg-accent/80 transition-colors active:scale-95 disabled:opacity-60"
                        >
                          <X className="w-4 h-4" /> Decline
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-full text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                  No incoming friend requests.
                </div>
              )}
            </div>
          </div>

          {/* Outgoing */}
          <div>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <UserCheck className="w-4 h-4" /> Outgoing ({sentRequests.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sentRequests.length > 0 ? sentRequests.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border p-5 bg-card flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-white/10"
                >
                  <div className="w-14 h-14 rounded-full bg-sky-500/10 flex items-center justify-center overflow-hidden shrink-0">
                    {req.receiver?.avatar ? (
                      <img src={req.receiver.avatar} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : req.receiver?.username ? (
                      <span className="text-sky-400 font-bold text-sm">{getInitials(req.receiver.username)}</span>
                    ) : (
                      <User className="w-6 h-6 text-sky-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{req.receiver?.username || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">Request {req.status.toLowerCase()}</p>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold shrink-0",
                    req.status === "PENDING" ? "bg-sky-500/10 text-sky-400" :
                    req.status === "ACCEPTED" ? "bg-emerald-500/10 text-emerald-400" :
                    req.status === "REJECTED" ? "bg-rose-500/10 text-rose-400" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {req.status}
                  </span>
                </motion.div>
              )) : (
                <div className="col-span-full text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                  No outgoing friend requests.
                </div>
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

      {/* Add Friend Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => { setShowAddModal(false); setSearchQuery(""); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.15 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">Add Friend</h2>
                  <button
                    onClick={() => { setShowAddModal(false); setSearchQuery(""); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by username or email..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {searchQuery.length >= 2 ? (
                  searchLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No users found.</p>
                  ) : (
                    <div className="space-y-3">
                      {searchResults.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                              {user.avatar ? (
                                <img src={user.avatar} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-primary font-bold text-xs">{getInitials(user.username)}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-sm">{user.username}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          {sentIdsSet.has(user.id) ? (
                            <span className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold">
                              <Check className="w-3.5 h-3.5" /> Sent
                            </span>
                          ) : (
                            <button
                              onClick={() => sendRequest.mutate(user.id)}
                              disabled={sendRequest.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-60"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Add
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Type at least 2 characters to search.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
