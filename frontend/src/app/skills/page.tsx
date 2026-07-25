'use client';

import { Search, ChevronLeft, ChevronRight, BookOpen, ArrowRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useState, useEffect } from 'react';

import { useSkills } from '@/shared/api/hooks';
import type { Skill } from '@/shared/api/schemas';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

const categories = [
  'All',
  'Programming',
  'Design',
  'Data Science',
  'DevOps',
  'Soft Skills',
  'Management',
  'Security',
];

export default function SkillsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data, isLoading, isError } = useSkills({
    search: debouncedSearch,
    category: category === 'All' ? undefined : category,
    page,
    limit: 20,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">Failed to load skills. Please try again.</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  interface PaginatedSkills {
    skills: Skill[];
    total: number;
    totalPages: number;
  }
  const paginatedData = data as PaginatedSkills | undefined;
  const skills = paginatedData?.skills || [];
  const total = paginatedData?.total || 0;
  const totalPages = paginatedData?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Browse Skills</h1>
          <p className="text-text-muted">Discover skills to add to your learning journey</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/contribute/skill')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Skill
          </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Search skills"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <SkillCardSkeleton key={i} />
            ))}
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-text-muted" />
            <h3 className="mt-4 text-lg font-medium">No skills found</h3>
            <p className="text-text-muted">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
{skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} router={router} />
            ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-text-muted">
                  Page {page} of {totalPages} ({total} skills)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SkillCard({ skill, router }: { skill: Skill; router: ReturnType<typeof useRouter> }) {
  return (
    <Card className="flex flex-col h-full transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{skill.name}</CardTitle>
            <p className="text-sm text-text-muted line-clamp-2">{skill.description}</p>
          </div>
          {skill.icon && <span className="text-2xl">{skill.icon}</span>}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant="secondary">{skill.category}</Badge>
          {skill.levels?.map((l: { level: number; description: string }) => (
            <Badge key={l.level} variant="outline">
              L{l.level}: {l.description?.slice(0, 30)}...
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex-1 flex justify-end pt-0">
        <Button variant="outline" size="sm" onClick={() => router.push(`/skills/${skill.id}`)}>
          View Details <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </CardFooter>
    </Card>
  );
}

function SkillCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-5 w-3/4 bg-border-strong rounded" />
        <div className="h-4 w-1/2 bg-border-strong rounded mt-2" />
      </CardHeader>
      <CardContent>
        <div className="h-4 w-1/4 bg-border-strong rounded mb-2" />
        <div className="h-4 w-1/3 bg-border-strong rounded" />
      </CardContent>
      <CardFooter>
        <div className="h-8 w-24 bg-border-strong rounded" />
      </CardFooter>
    </Card>
  );
}