
import { describe, it, expect } from "vitest";
import { isMatch, type BuddyRequest } from "../lib/matching";

const alice: BuddyRequest = {
  id: "request-1",
  userId: "alice",
  sport: "Badminton",
  date: "2026-11-10",
  startTime: "14:00",
  endTime: "16:00",
};

describe("Gym Connect buddy matching", () => {
  it("matches students with overlapping availability", () => {
    const bob = {
      ...alice,
      id: "request-2",
      userId: "bob",
      startTime: "15:00",
      endTime: "17:00",
    };

    expect(isMatch(alice, bob)).toBe(true);
  });

  it("rejects different sports", () => {
    const bob = {
      ...alice,
      userId: "bob",
      sport: "Basketball",
    };

    expect(isMatch(alice, bob)).toBe(false);
  });

  it("rejects different dates", () => {
    const bob = {
      ...alice,
      userId: "bob",
      date: "2026-11-11",
    };

    expect(isMatch(alice, bob)).toBe(false);
  });

  it("rejects non-overlapping times", () => {
    const bob = {
      ...alice,
      userId: "bob",
      startTime: "17:00",
      endTime: "19:00",
    };

    expect(isMatch(alice, bob)).toBe(false);
  });

  it("rejects times that only touch at a boundary", () => {
    const bob = {
      ...alice,
      userId: "bob",
      startTime: "16:00",
      endTime: "18:00",
    };

    expect(isMatch(alice, bob)).toBe(false);
  });

  it("prevents students from matching with themselves", () => {
    const anotherRequest = {
      ...alice,
      id: "request-3",
    };

    expect(isMatch(alice, anotherRequest)).toBe(false);
  });

  it("rejects invalid availability ranges", () => {
    const bob = {
      ...alice,
      userId: "bob",
      startTime: "18:00",
      endTime: "16:00",
    };

    expect(isMatch(alice, bob)).toBe(false);
  });
});
