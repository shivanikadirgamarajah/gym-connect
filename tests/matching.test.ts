import { describe, it, expect } from "vitest";
import {
    isMatch,
    getOverlapMinutes,
    findMatches,
    type BuddyRequest,
} from "../lib/matching";

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


    it("requires at least 15 minutes of overlap", () => {
        const bob: BuddyRequest = {
            ...alice,
            id: "request-2",
            userId: "bob",
            startTime: "15:50",
            endTime: "17:00",
        };

        expect(getOverlapMinutes(alice, bob)).toBe(10);
        expect(isMatch(alice, bob, 15)).toBe(false);

        const charlie: BuddyRequest = {
            ...bob,
            id: "request-3",
            userId: "charlie",
            startTime: "15:45",
        };

        expect(isMatch(alice, charlie, 15)).toBe(true);
    });


    it("finds multiple eligible buddies", () => {
        const bob: BuddyRequest = {
            ...alice,
            id: "request-2",
            userId: "bob",
            startTime: "15:00",
            endTime: "17:00",
        };

        const charlie: BuddyRequest = {
            ...alice,
            id: "request-3",
            userId: "charlie",
            startTime: "14:30",
            endTime: "16:30",
        };

        const matches = findMatches(
            alice,
            [bob, charlie]
        );

        expect(matches).toHaveLength(2);
    });


    it("returns each student only once", () => {
        const bob1: BuddyRequest = {
            ...alice,
            id: "request-2",
            userId: "bob",
            startTime: "15:00",
            endTime: "17:00",
        };

        const bob2: BuddyRequest = {
            ...bob1,
            id: "request-3",
            startTime: "14:00",
            endTime: "16:00",
        };

        const matches = findMatches(
            alice,
            [bob1, bob2]
        );

        expect(matches).toHaveLength(1);
        expect(matches[0].request.id).toBe("request-3");
    });


    it("sorts buddies by longest overlap", () => {
        const bob: BuddyRequest = {
            ...alice,
            id: "request-2",
            userId: "bob",
            startTime: "15:30",
            endTime: "17:00",
        };

        const charlie: BuddyRequest = {
            ...alice,
            id: "request-3",
            userId: "charlie",
            startTime: "14:00",
            endTime: "16:00",
        };

        const matches = findMatches(
            alice,
            [bob, charlie]
        );

        expect(
            matches.map((m) => m.request.userId)
        ).toEqual(["charlie", "bob"]);

        expect(
            matches.map((m) => m.overlapMinutes)
        ).toEqual([120, 30]);
    });



});
