import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CourseCard({ course, modules, onOpenLessonQuiz, onOpenModuleQuiz }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [openModuleId, setOpenModuleId] = useState<number | null>(null);

  const filteredModules = useMemo(
    () => modules.filter((m: any) => m.title.toLowerCase().includes(searchTerm.toLowerCase())),
    [modules, searchTerm],
  );

  const visibleModules = showAll ? filteredModules : filteredModules.slice(0, 3);

  return (
    <Card className="break-inside-avoid overflow-hidden shadow-sm">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <img
          src={course.thumbnail}
          onError={e => {
            e.currentTarget.src =
              'https://cdn2.fptshop.com.vn/unsafe/800x0/background_cong_nghe_1_6e86eb81f8.jpg';
          }}
          className="absolute inset-0 h-full w-full object-contai"
        />
      </div>

      <CardHeader>
        <CardTitle className="flex justify-between">{course.title}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Search */}
          <div className="flex w-full gap-2 ">
            <input
              className="flex-grow border rounded px-3 py-2"
              placeholder="Find chapters..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button
              className="px-4 py-2 border rounded hover:bg-gray-300 transition"
              onClick={() => {
                setSearchTerm('');
                setShowAll(false);
              }}
            >
              Erase
            </button>
          </div>

          {visibleModules.map(
            (m: { id: React.Key | null | undefined; title: string; lessons: any[] }) => (
              <div key={m.id} className="border rounded p-3">
                <div
                  className="flex justify-between items-center mb-2 cursor-pointer"
                  onClick={() => setOpenModuleId(prev => (prev === m.id ? null : (m.id as any)))}
                >
                  {' '}
                  <span className="font-medium">{m.title}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onOpenModuleQuiz({
                        courseId: course.id,
                        moduleId: m.id,
                        moduleTitle: m.title,
                      })
                    }
                  >
                    Quiz Chapter
                  </Button>
                </div>

                {/* Lesson list */}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {m.lessons?.map((l: any) => (
                    <div key={l.id} className="flex justify-between border rounded p-2">
                      <span>{l.title}</span>

                      <Button
                        size="sm"
                        onClick={() =>
                          onOpenLessonQuiz({
                            courseId: course.id,
                            moduleId: m.id,
                            lessonId: l.id,
                            lessonTitle: l.title,
                          })
                        }
                      >
                        Quiz Lesson
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}

          {filteredModules.length > 3 && (
            <Button variant="ghost" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Collapse' : `See more (${filteredModules.length - 3})`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
