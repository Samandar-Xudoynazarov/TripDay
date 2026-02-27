import { useCallback, useEffect, useMemo, useState } from "react";
import {
  commentsApi,
  eventImagesApi,
  eventsApi,
  likesApi,
  registrationsApi,
} from "@/lib/api";
import type { CommentItem, EventData } from "../types";

export function useEventDetail(eventId?: number, isAuthed: boolean = false) {
  const [event, setEvent] = useState<EventData | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [regCount, setRegCount] = useState(0);
  const [registered, setRegistered] = useState(false);

  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false); // ✅ YANGI
  const [comments, setComments] = useState<CommentItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [regLoading, setRegLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  const refreshAll = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);
    try {
      const [eventRes, imgRes, likesRes, commentsRes] = await Promise.all([
        eventsApi.getById(eventId),
        eventImagesApi.getImages(eventId),
        likesApi.count(eventId),
        commentsApi.getAll(eventId),
      ]);

      // registrations count endpoint token talab qilishi mumkin.
      if (isAuthed) {
        try {
          const countRes = await registrationsApi.getCountByEvent(eventId);
          setRegCount(typeof countRes.data === "number" ? countRes.data : 0);
        } catch {
          setRegCount(0);
        }
      } else {
        setRegCount(0);
      }

      // ✅ liked holatini aniqlash (agar login bo‘lsa)
      if (isAuthed) {
        try {
          // Agar sende shunday endpoint bo‘lsa:
          // likesApi.isLiked(eventId) -> boolean qaytaradi
          const likedRes = await (likesApi as any).isLiked?.(eventId);
          if (likedRes?.data !== undefined) setLiked(!!likedRes.data);
          // Agar isLiked yo‘q bo‘lsa, shu catchga tushadi va likedni false qilamiz
        } catch {
          // isLiked endpoint bo‘lmasa ham ishlashi uchun:
          // likedni hozircha false qoldiramiz (keyin toggle bosilganda o‘zgaradi)
          setLiked(false);
        }
      } else {
        setLiked(false);
      }

      setEvent(eventRes.data);
      // ⚠️ Netlify/Prod’da backend ba’zan array o‘rniga object/string qaytarishi mumkin.
      // Shuning uchun doim Array qilib normallashtiramiz.
      const rawImgs = (imgRes as any)?.data;
      const safeImgs = Array.isArray(rawImgs)
        ? rawImgs.map(String)
        : Array.isArray(rawImgs?.data)
          ? rawImgs.data.map(String)
          : [];
      setImages(safeImgs);
      setLikeCount(typeof likesRes.data === "number" ? likesRes.data : 0);
      setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
    } finally {
      setLoading(false);
    }
  }, [eventId, isAuthed]);

  useEffect(() => {
    refreshAll().catch(() => setLoading(false));
  }, [refreshAll]);

  const location = useMemo(() => {
    if (!event) return null;
    return { lat: event.latitude, lng: event.longitude };
  }, [event]);

  const register = useCallback(async () => {
    if (!event) return;
    setRegLoading(true);
    try {
      await registrationsApi.register(event.id);
      setRegistered(true);
      setRegCount((c) => c + 1);
    } finally {
      setRegLoading(false);
    }
  }, [event]);

  const toggleLike = useCallback(async () => {
    if (!eventId) return;
    setLikeLoading(true);
    try {
      await likesApi.toggle(eventId);

      // ✅ UI uchun darhol likedni almashtiramiz
      setLiked((p) => !p);

      // like countni qayta olib kelamiz
      const res = await likesApi.count(eventId);
      setLikeCount(typeof res.data === "number" ? res.data : 0);
    } finally {
      setLikeLoading(false);
    }
  }, [eventId]);

  const addComment = useCallback(
    async (text: string) => {
      if (!eventId) return;
      setCommentLoading(true);
      try {
        await commentsApi.create(eventId, text);
        const res = await commentsApi.getAll(eventId);
        setComments(Array.isArray(res.data) ? res.data : []);
      } finally {
        setCommentLoading(false);
      }
    },
    [eventId]
  );

  const deleteComment = useCallback(async (commentId: number) => {
    setCommentLoading(true);
    try {
      await commentsApi.delete(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } finally {
      setCommentLoading(false);
    }
  }, []);

  return {
    event,
    images,
    regCount,
    registered,
    likeCount,
    liked, // ✅ tashqariga chiqarildi
    comments,
    loading,
    regLoading,
    likeLoading,
    commentLoading,
    location,
    actions: { refreshAll, register, toggleLike, addComment, deleteComment },
    setters: { setRegistered },
  };
}