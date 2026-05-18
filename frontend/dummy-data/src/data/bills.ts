export const billsData = [
  {
    id: "sb-1",
    description: "Dinner at Warung Nasi",
    date: "2025-05-10T19:00:00Z",
    totalAmount: 300000,
    status: "PENDING",
    creator: "me",
    type: "they_owe_me",
    participants: [
      { name: "Budi", amount: 100000, status: "pending", avatar: "B" },
      { name: "Siti", amount: 100000, status: "paid", avatar: "S" }
    ]
  },
  {
    id: "sb-2",
    description: "Netflix Subscription",
    date: "2025-05-01T10:00:00Z",
    totalAmount: 180000,
    status: "PENDING",
    creator: "Andi",
    type: "i_owe_them",
    participants: [
      { name: "Me", amount: 60000, status: "pending", avatar: "M" }
    ]
  },
  {
    id: "sb-3",
    description: "GoRide to Office",
    date: "2025-05-05T08:00:00Z",
    totalAmount: 45000,
    status: "SETTLED",
    creator: "Me",
    type: "they_owe_me",
    participants: [
      { name: "Joko", amount: 22500, status: "paid", avatar: "J" }
    ]
  }
];
