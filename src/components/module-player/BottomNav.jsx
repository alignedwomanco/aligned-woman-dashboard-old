import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function BottomNav({ previousModule, nextModule, courseId }) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Previous */}
      {previousModule ? (
        <Link
          to={createPageUrl("ModulePlayer") + `?moduleId=${previousModule.id}&courseId=${courseId}`}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex-1"
        >
          <ArrowLeft className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{previousModule.title}</span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {/* Back to course overview */}
      <Link
        to={createPageUrl("CourseDetail") + `?courseId=${courseId}`}
        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-[#3B224E] hover:bg-gray-50 transition-colors"
      >
        Back to course overview
      </Link>

      {/* Next */}
      {nextModule ? (
        <Link
          to={createPageUrl("ModulePlayer") + `?moduleId=${nextModule.id}&courseId=${courseId}`}
          className="flex items-center justify-end gap-2 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex-1"
        >
          <span className="truncate">{nextModule.title}</span>
          <ArrowRight className="w-4 h-4 flex-shrink-0" />
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}