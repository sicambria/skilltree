'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { ArrowRight, BarChart, BookOpen, Star, Target, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const stats = [
  { name: 'Skills Rated', value: '24', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { name: 'Trees Subscribed', value: '3', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
  { name: 'Plan Progress', value: '67%', icon: Target, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { name: 'Learning Hours', value: '42', icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10' },
];

const recentActivity = [
  { type: 'level_up', skill: 'TypeScript', level: 4, time: '2 hours ago' },
  { type: 'training', skill: 'React Patterns', training: 'Advanced React', time: '1 day ago' },
  { type: 'plan', skill: 'System Design', horizon: '1-year', time: '3 days ago' },
  { type: 'level_up', skill: 'GraphQL', level: 3, time: '5 days ago' },
];

export function DashboardContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-text-muted">Welcome back! Here's your learning overview.</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/plan">View Plan <ArrowRight className="ml-2 h-4 w-4" /></a>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted">{stat.name}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={cn('p-3 rounded-xl', stat.bg)}>
                  <stat.icon className={cn('h-6 w-6', stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-4 p-3 rounded-lg',
                    index === recentActivity.length - 1 ? '' : 'border-b border-border-strong'
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-full',
                      activity.type === 'level_up' && 'bg-green-100 text-green-600',
                      activity.type === 'training' && 'bg-blue-100 text-blue-600',
                      activity.type === 'plan' && 'bg-purple-100 text-purple-600'
                    )}
                  >
                    {activity.type === 'level_up' && <TrendingUp className="h-5 w-5" />}
                    {activity.type === 'training' && <BookOpen className="h-5 w-5" />}
                    {activity.type === 'plan' && <Target className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {activity.type === 'level_up' && `Leveled up ${activity.skill} to level ${activity.level}`}
                      {activity.type === 'training' && `Started "${activity.training}" for ${activity.skill}`}
                      {activity.type === 'plan' && `Added ${activity.skill} to ${activity.horizon} plan`}
                    </p>
                    <p className="text-xs text-text-muted">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" className="h-auto py-4 flex-col items-start gap-2" asChild>
                <a href="/skills">
                  <BookOpen className="h-6 w-6" />
                  <span className="font-medium">Browse Skills</span>
                  <p className="text-xs text-text-muted">Discover new skills to learn</p>
                </a>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col items-start gap-2" asChild>
                <a href="/trees">
                  <TrendingUp className="h-6 w-6" />
                  <span className="font-medium">Browse Trees</span>
                  <p className="text-xs text-text-muted">Explore learning paths</p>
                </a>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col items-start gap-2" asChild>
                <a href="/plan">
                  <Target className="h-6 w-6" />
                  <span className="font-medium">Update Plan</span>
                  <p className="text-xs text-text-muted">Adjust your learning goals</p>
                </a>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col items-start gap-2" asChild>
                <a href="/community">
                  <Users className="h-6 w-6" />
                  <span className="font-medium">Community</span>
                  <p className="text-xs text-text-muted">Connect with learners</p>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}