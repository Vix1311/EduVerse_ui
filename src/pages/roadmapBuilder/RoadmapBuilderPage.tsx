import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronLeft,
  GripVertical,
  Sparkles,
  Route,
  ArrowRight,
  CheckCircle2,
  Circle,
  BookOpen,
  Trophy,
  UserRound,
  Wallet,
  Lock,
  PlayCircle,
  Layers3,
} from 'lucide-react';

type Level = 'Beginner' | 'Intermediate' | 'Advanced';

type PlacementResult = {
  categoryId: string;
  categoryTitle: string;
  score: number;
  maxScore: number;
  level: Level;
  answers: Record<string, number>;
};

type RoadmapNodeType = 'section' | 'course' | 'project';

type NodeStatus = 'done' | 'current' | 'locked' | 'available';

type RoadmapNode = {
  id: string;
  title: string;
  subtitle: string;
  outcome: string;
  type: RoadmapNodeType;
  thumbnail: string;
  author: string;
  price: string;
  ageOrInput?: string;
  output?: string;
  status?: NodeStatus;
};

type RoadmapGroup = {
  id: string;
  title: string;
  subtitle: string;
  stageTitle: string;
  stageDescription: string[];
  categoryId: string;
  level: Level;
  color: 'teal' | 'orange' | 'blue';
  nodes: RoadmapNode[];
};

function getPlacementResult(): PlacementResult | null {
  try {
    const raw = localStorage.getItem('placement_result');
    if (!raw) return null;
    return JSON.parse(raw) as PlacementResult;
  } catch {
    return null;
  }
}

function makeThumb(text: string): string {
  return `https://placehold.co/480x280/f1f5f9/0f172a?text=${encodeURIComponent(text)}`;
}

function getNodeTypeIcon(type: RoadmapNodeType) {
  if (type === 'section') return <Circle size={14} />;
  if (type === 'course') return <BookOpen size={14} />;
  return <Trophy size={14} />;
}

function getColorTheme(color: RoadmapGroup['color']) {
  if (color === 'teal') {
    return {
      ribbon: 'bg-teal-500 text-white',
      ribbonCut: 'border-l-teal-600',
      soft: 'bg-teal-50',
      softBorder: 'ring-teal-100',
      accent: 'bg-teal-500',
      accentSoft: 'bg-teal-100 text-teal-700',
      line: 'bg-teal-200',
      sectionBg: 'bg-gradient-to-b from-teal-500 to-teal-400',
      stageBg: 'bg-teal-100/70',
      statusCurrent: 'bg-teal-100 text-teal-700 ring-teal-200',
    };
  }

  if (color === 'orange') {
    return {
      ribbon: 'bg-orange-500 text-white',
      ribbonCut: 'border-l-orange-600',
      soft: 'bg-orange-50',
      softBorder: 'ring-orange-100',
      accent: 'bg-orange-500',
      accentSoft: 'bg-orange-100 text-orange-700',
      line: 'bg-orange-200',
      sectionBg: 'bg-gradient-to-b from-orange-500 to-orange-400',
      stageBg: 'bg-orange-100/70',
      statusCurrent: 'bg-orange-100 text-orange-700 ring-orange-200',
    };
  }

  return {
    ribbon: 'bg-sky-500 text-white',
    ribbonCut: 'border-l-sky-600',
    soft: 'bg-sky-50',
    softBorder: 'ring-sky-100',
    accent: 'bg-sky-500',
    accentSoft: 'bg-sky-100 text-sky-700',
    line: 'bg-sky-200',
    sectionBg: 'bg-gradient-to-b from-sky-500 to-sky-400',
    stageBg: 'bg-sky-100/70',
    statusCurrent: 'bg-sky-100 text-sky-700 ring-sky-200',
  };
}

function buildRoadmapGroups(categoryId: string, level: Level): RoadmapGroup[] {
  const commonStatus =
    level === 'Beginner'
      ? (['current', 'available', 'locked', 'locked'] as NodeStatus[])
      : level === 'Intermediate'
        ? (['done', 'current', 'available', 'locked'] as NodeStatus[])
        : (['done', 'done', 'current', 'available'] as NodeStatus[]);

  const courseSet = (prefix: string, labels: string[]) =>
    labels.map((label, index) => {
      const nodeData = labelToNode(label, commonStatus[index]);
      return {
        ...nodeData,
        id: `${prefix}_${index + 1}`,
      };
    });

  const data: Record<string, RoadmapGroup[]> = {
    'frontend-programming': [
      {
        id: 'fe_stage_1',
        title: 'Frontend Foundation',
        subtitle: 'Get familiar with interface languages and basic web structure',
        stageTitle: 'STAGE 1: BUILDING THE FOUNDATION',
        stageDescription: [
          'Get familiar with HTML, CSS, and basic web structure',
          'Recognize common interface components',
          'Start building layout thinking',
        ],
        categoryId,
        level,
        color: 'teal',
        nodes: courseSet('fe_s1', [
          'HTML Basics|Starter level|Understand page structure, basic tags, and simple semantics|Beginner|Create a basic HTML page|section|HTML Basics|Teacher Nam|299,000 VND',
          'CSS Basics|Build core styling skills|Learn selectors, colors, typography, spacing, and the box model|Know basic HTML|Style a simple interface independently|course|CSS Basics|Ms. Linh|349,000 VND',
          'Layout Intro|Introduction to Flexbox|Understand alignment, blocks, columns, and rows|Basic HTML + CSS|Create 1-column and 2-column layouts|course|Layout Intro|Frontend Lab|399,000 VND',
          'Mini Page|First landing page|Complete a simple page to reinforce the basics|Know basic HTML/CSS|Finish a mini page|project|Mini Page|Admin|Free',
          'Mini Page|First landing page|Complete a simple page to reinforce the basics|Know basic HTML/CSS|Finish a mini page|project|Mini Page|Admin|Free',
        ]),
      },
      {
        id: 'fe_stage_2',
        title: 'Responsive & Component',
        subtitle: 'Develop UI skills and reusable thinking',
        stageTitle: 'STAGE 2: SKILL DEVELOPMENT',
        stageDescription: [
          'Learn responsive design and common UI patterns',
          'Break interfaces into reusable components',
          'Improve speed in building practical UIs',
        ],
        categoryId,
        level,
        color: 'orange',
        nodes: courseSet('fe_s2', [
          'Responsive 1|Media queries & mobile-first|Build interfaces suitable for mobile, tablet, and desktop|Know basic layout|Build a basic responsive page|section|Responsive 1|UI Code Studio|459,000 VND',
          'Component Thinking|Thinking in components|Learn how to break buttons, cards, and inputs into reusable parts|Know basic responsive design|Create clean and scalable UI|course|Component Thinking|Mr. Phuc|499,000 VND',
          'JS for UI|JavaScript for basic interactions|Add events, small state transitions, and list rendering|Understand HTML/CSS|Build interactive UIs|course|JS for UI|Lam Dev|549,000 VND',
          'Mini Dashboard|UI practice project|Build a simple dashboard with responsive layout and components|Understand basic UI JS|Deliver a complete product|project|Mini Dashboard|Frontend House|Free',
        ]),
      },
      {
        id: 'fe_stage_3',
        title: 'Framework & Real Project',
        subtitle: 'Framework foundation and real-world projects',
        stageTitle: 'STAGE 3: REAL PRACTICE',
        stageDescription: [
          'Apply component thinking at the framework level',
          'Strengthen clean code, state, and project structure skills',
          'Get ready for real product development',
        ],
        categoryId,
        level,
        color: 'blue',
        nodes: courseSet('fe_s3', [
          'React Foundation|Components + props + state|Get familiar with a framework and modern UI flow|Basic UI JS|Understand the React workflow|section|React Foundation|React School|599,000 VND',
          'State & Routing|Routing and small state management|Organize apps better and make them easier to scale|Know basic React|Build a multi-screen app|course|State Routing|Nguyen Minh|649,000 VND',
          'Project Architecture|Frontend project structure|Learn how to split folders, modules, and basic data flow|React foundation|Have a clear app structure|course|Project Architecture|Tech Mentor|699,000 VND',
          'Real Product UI|Real-world project|Build a product with interface, logic, and polished completion|Know React and architecture|Frontend portfolio piece|project|Real Product UI|Admin|Free',
        ]),
      },
    ],

    programming: [
      {
        id: 'prog_stage_1',
        title: 'Programming Foundation',
        subtitle: 'Variables, conditions, loops, and functions',
        stageTitle: 'STAGE 1: BUILDING THINKING',
        stageDescription: [
          'Get familiar with basic programming logic',
          'Understand variables, if statements, loops, and functions',
          'Start solving simple problems',
        ],
        categoryId,
        level,
        color: 'teal',
        nodes: courseSet('prog_s1', [
          'Programming Basics|Variables and data types|Understand the basics of input and output logic|Beginner|Write basic code snippets|section|Programming Basics|Code Start|249,000 VND',
          'Control Flow|If/else and loops|Control program flow based on conditions|Know variables|Solve basic problems|course|Control Flow|Anh Khoa|319,000 VND',
          'Functions|Reuse logic|Learn to write functions to break problems into smaller parts|Control flow|Write cleaner and clearer code|course|Functions|Logic Lab|359,000 VND',
          'Mini Logic Set|Foundation exercises|Practice a set of basic exercises with increasing difficulty|Know functions|Reinforce thinking|project|Mini Logic Set|Admin|Free',
        ]),
      },
      {
        id: 'prog_stage_2',
        title: 'Problem Solving',
        subtitle: 'Problem solving and basic data structures',
        stageTitle: 'STAGE 2: SKILL DEVELOPMENT',
        stageDescription: [
          'Practice breaking problems into smaller parts',
          'Get familiar with arrays, objects/maps, and basic stacks/queues',
          'Improve problem reading and interpretation',
        ],
        categoryId,
        level,
        color: 'orange',
        nodes: courseSet('prog_s2', [
          'Array & Object|Working with data|Process lists and group basic data|Programming basics|Handle data more effectively|section|Array Object|Code Tree|389,000 VND',
          'Problem Solving 1|Problem-solving mindset|Analyze input/output and write solution strategies|Know arrays|Solve intermediate problems|course|Problem Solving 1|Binh Code|429,000 VND',
          'DSA Intro|Stack, queue, map|Understand how to choose suitable data structures|Know basic logic|Improve problem-solving speed|course|DSA Intro|DSA Room|479,000 VND',
          'Coding Sprint|Mini challenge set|Complete a challenge set to test your thinking|Know DSA intro|Become more confident solving problems|project|Coding Sprint|Admin|Free',
        ]),
      },
      {
        id: 'prog_stage_3',
        title: 'Build & Practice',
        subtitle: 'Apply programming to small projects',
        stageTitle: 'STAGE 3: PRACTICAL APPLICATION',
        stageDescription: [
          'Combine logic, data structures, and coding workflow',
          'Build mini projects instead of only solving isolated exercises',
          'Create a bridge toward specific languages or frameworks',
        ],
        categoryId,
        level,
        color: 'blue',
        nodes: courseSet('prog_s3', [
          'Clean Code Intro|Readable, maintainable code|Understand naming, function splitting, and logic organization|Problem solving|Write more structured code|section|Clean Code|Tech Mentor|499,000 VND',
          'Mini App Logic|Build a small application|Apply logic to a simple product|Know clean code intro|Create a complete mini app|course|Mini App Logic|Anh Duong|559,000 VND',
          'Debugging Mindset|Debug systematically|Read logs, isolate issues, and test step by step|Know mini app basics|Work more efficiently|course|Debugging Mindset|Dev Room|599,000 VND',
          'Portfolio Mini Project|Capstone project|Build a project to include in your learning portfolio|Understand the steps above|Have a showcase product|project|Portfolio Project|Admin|Free',
        ]),
      },
    ],
  };

  return data[categoryId] ?? data['frontend-programming'];
}

function labelToNode(raw: string, status: NodeStatus): RoadmapNode {
  const [title, subtitle, outcome, ageOrInput, output, type, thumbLabel, author, price] =
    raw.split('|');

  return {
    id: `${title}-${subtitle}`.toLowerCase().replace(/\s+/g, '-'),
    title,
    subtitle,
    outcome,
    ageOrInput,
    output,
    type: type as RoadmapNodeType,
    thumbnail: makeThumb(thumbLabel),
    author,
    price,
    status,
  };
}

function progressFromStatus(groups: RoadmapGroup[]) {
  const all = groups.flatMap(group => group.nodes);
  const done = all.filter(node => node.status === 'done').length;
  return {
    completedCount: done,
    totalCount: all.length,
    totalProgress: all.length ? Math.round((done / all.length) * 100) : 0,
  };
}

export default function RoadmapBuilderPage() {
  const navigate = useNavigate();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const placement = React.useMemo(() => getPlacementResult(), []);

  const initialGroups = React.useMemo<RoadmapGroup[]>(() => {
    if (!placement) return [];
    return buildRoadmapGroups(placement.categoryId, placement.level);
  }, [placement]);

  const [groups, setGroups] = React.useState<RoadmapGroup[]>(initialGroups);

  const onDragEndGroup = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setGroups((prev: RoadmapGroup[]) => {
      const oldIndex = prev.findIndex((item: RoadmapGroup) => item.id === active.id);
      const newIndex = prev.findIndex((item: RoadmapGroup) => item.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const onDragEndNode = (groupId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setGroups((prev: RoadmapGroup[]) =>
      prev.map((group: RoadmapGroup) => {
        if (group.id !== groupId) return group;

        const oldIndex = group.nodes.findIndex((node: RoadmapNode) => node.id === active.id);
        const newIndex = group.nodes.findIndex((node: RoadmapNode) => node.id === over.id);

        return {
          ...group,
          nodes: arrayMove(group.nodes, oldIndex, newIndex),
        };
      }),
    );
  };

  const toggleDone = (groupId: string, nodeId: string) => {
    setGroups((prev: RoadmapGroup[]) =>
      prev.map((group: RoadmapGroup) => {
        if (group.id !== groupId) return group;

        return {
          ...group,
          nodes: group.nodes.map((node: RoadmapNode) => {
            if (node.id !== nodeId) return node;
            return {
              ...node,
              status: node.status === 'done' ? 'available' : 'done',
            };
          }),
        };
      }),
    );
  };

  if (!placement) {
    return (
      <div className="min-h-screen bg-[#f6f7fb] px-4 py-10 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-[28px] bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.06)] ring-1 ring-slate-200">
          <h1 className="text-2xl font-semibold">No assessment data yet</h1>
          <p className="mt-3 text-slate-600">
            You need to choose a category and complete the assessment before entering the roadmap.
          </p>
          <button
            onClick={() => navigate('/placement')}
            className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white"
          >
            Go to assessment
          </button>
        </div>
      </div>
    );
  }

  const { completedCount, totalCount, totalProgress } = progressFromStatus(groups);

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/placement')}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <ChevronLeft size={18} />
            Back to test
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              <Layers3 size={16} />
              Refresh
            </button>

            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Back to home
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[30px] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-slate-200 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
              <Sparkles size={16} />
              Personalized roadmap
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              {placement.categoryTitle}
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              This version has been converted into a more visual roadmap style: divided into stages,
              viewed from left to right like an infographic, while still keeping drag-and-drop
              functionality so you can rearrange the path.
            </p>
          </div>

          <div className="rounded-[30px] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-slate-200 sm:p-8">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Overview
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <StatCard label="Level" value={placement.level} />
              <StatCard label="Completed" value={`${completedCount}/${totalCount}`} />
              <StatCard label="Progress" value={`${totalProgress}%`} />
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-900 transition-all"
                style={{ width: `${totalProgress}%` }}
              />
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="flex items-start gap-3">
                <Route className="mt-0.5 text-slate-500" size={18} />
                <div>
                  <div className="font-semibold text-slate-900">Usage tip</div>
                  <div className="mt-1 text-sm leading-6 text-slate-500">
                    Drag an entire stage to reorder it. Drag each card to reorder levels or lessons
                    within the same stage.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndGroup}>
          <SortableContext
            items={groups.map((group: RoadmapGroup) => group.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid gap-8 ">
              {groups.map((group: RoadmapGroup) => (
                <SortableRoadmapGroup
                  key={group.id}
                  group={group}
                  sensors={sensors}
                  onDragEndNode={onDragEndNode}
                  onToggleDone={toggleDone}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function SortableRoadmapGroup({
  group,
  sensors,
  onDragEndNode,
  onToggleDone,
}: {
  group: RoadmapGroup;
  sensors: ReturnType<typeof useSensors>;
  onDragEndNode: (groupId: string, event: DragEndEvent) => void;
  onToggleDone: (groupId: string, nodeId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id,
  });

  const theme = getColorTheme(group.color);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-70' : ''}>
      <div className="relative rounded-[30px] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-slate-200">
        <div className="relative px-5 pt-5 sm:px-6">
          <div className="relative mb-6">
            <div
              className={`relative inline-flex min-h-[54px] items-center px-6 py-3 pr-12 text-xl font-bold uppercase tracking-wide ${theme.ribbon}`}
            >
              {group.title}
              <div className="absolute right-[-24px] top-0 h-0 w-0 border-b-[27px] border-l-[24px] border-t-[27px] border-b-transparent border-t-transparent border-l-white" />
            </div>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                {group.stageTitle}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{group.subtitle}</p>
            </div>

            <button
              {...attributes}
              {...listeners}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-200"
            >
              <GripVertical size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 pb-5 sm:px-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event: DragEndEvent) => onDragEndNode(group.id, event)}
          >
            <SortableContext
              items={group.nodes.map((node: RoadmapNode) => node.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="mt-6 overflow-x-auto pb-2">
                <div className="grid min-w-max grid-flow-col auto-cols-[260px] items-start gap-4">
                  {group.nodes.map((node: RoadmapNode, index: number) => (
                    <SortableRoadmapNode
                      key={node.id}
                      node={node}
                      index={index}
                      color={group.color}
                      onToggleDone={() => onToggleDone(group.id, node.id)}
                    />
                  ))}
                </div>
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className={`border-t border-white/30 px-5 py-5 ${theme.stageBg} sm:px-6`}>
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-700">
            {group.stageTitle}
          </div>

          <div className="mt-3 space-y-2">
            {group.stageDescription.map((item, idx) => (
              <div key={idx} className="flex gap-3 text-sm text-slate-700">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                <div>{item}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableRoadmapNode({
  node,
  index,
  color,
  onToggleDone,
}: {
  node: RoadmapNode;
  index: number;
  color: RoadmapGroup['color'];
  onToggleDone: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
  });

  const theme = getColorTheme(color);

  const heights = ['h-[280px]', 'h-[330px]', 'h-[380px]', 'h-[430px]'];
  const boxHeight = heights[index] ?? 'h-[320px]';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const statusLabel =
    node.status === 'done'
      ? 'Completed'
      : node.status === 'current'
        ? 'Next'
        : node.status === 'locked'
          ? 'Locked'
          : 'Ready';

  const statusClass =
    node.status === 'done'
      ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
      : node.status === 'current'
        ? theme.statusCurrent
        : node.status === 'locked'
          ? 'bg-slate-100 text-slate-500 ring-slate-200'
          : 'bg-white text-slate-700 ring-slate-200';

  return (
    <div ref={setNodeRef} style={style} className={`relative ${isDragging ? 'opacity-70' : ''}`}>
      <div className="absolute left-1/2 top-[-18px] z-10 h-4 w-px -translate-x-1/2 bg-slate-300" />

      <div className="absolute left-1/2 top-[-18px] z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-slate-300" />

      <div
        className={`relative ${boxHeight} overflow-hidden rounded-t-[22px] ${theme.sectionBg} p-4 text-white shadow-lg`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]">
            Step {index + 1}
          </div>

          <button
            {...attributes}
            {...listeners}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white transition hover:bg-white/25"
          >
            <GripVertical size={16} />
          </button>
        </div>

        <div className="mt-5">
          <div className="text-2xl font-bold leading-tight">{node.title}</div>
          <div className="mt-2 text-sm font-semibold text-white/90">{node.ageOrInput}</div>
        </div>

        <div className="mt-5 rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">
            Output goal
          </div>
          <div className="mt-2 text-lg font-bold leading-snug">{node.outcome}</div>
        </div>

        <div className="mt-4 text-sm text-white/90">{node.output}</div>
      </div>

      <div className="rounded-b-[22px] bg-white p-4 ring-1 ring-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
          <img src={node.thumbnail} alt={node.title} className="h-36 w-full object-cover" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass}`}
          >
            {node.status === 'done' ? (
              <CheckCircle2 size={13} />
            ) : node.status === 'locked' ? (
              <Lock size={13} />
            ) : (
              <PlayCircle size={13} />
            )}
            {statusLabel}
          </div>

          <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            {getNodeTypeIcon(node.type)}
            {node.type}
          </div>
        </div>

        <div className="mt-3">
          <div className="text-base font-semibold text-slate-900">{node.subtitle}</div>
          <p className="mt-1 text-sm leading-6 text-slate-500">{node.outcome}</p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 px-3 py-3 ring-1 ring-slate-200">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <UserRound size={13} />
              Publisher
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-800">{node.author}</div>
          </div>

          <div className="rounded-2xl bg-slate-50 px-3 py-3 ring-1 ring-slate-200">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <Wallet size={13} />
              Price
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-800">{node.price}</div>
          </div>
        </div>

        <button
          onClick={onToggleDone}
          className={[
            'mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ring-1 transition',
            node.status === 'done'
              ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
              : 'bg-slate-900 text-white ring-slate-900 hover:bg-slate-800',
          ].join(' ')}
        >
          <CheckCircle2 size={16} />
          {node.status === 'done' ? 'Completed' : 'Mark as completed'}
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}
