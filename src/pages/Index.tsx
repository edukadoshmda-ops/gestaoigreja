import { Link } from 'react-router-dom';
import { ArrowRight, Users, Church, BarChart3, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { DailyVerse } from '@/components/DailyVerse';

const features = [
  {
    icon: Users,
    title: 'Gestão de Membros',
    description: 'Organize e acompanhe todos os membros da igreja com praticidade.',
  },
  {
    icon: Church,
    title: 'Ministérios',
    description: 'Gerencie células, grupos e ministérios de forma centralizada.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios',
    description: 'Tenha relatórios claros para decisões administrativas e financeiras.',
  },
  {
    icon: Shield,
    title: 'Acesso Seguro',
    description: 'Permissões definidas por perfil, garantindo segurança total.',
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">

            {/* LOGO — 200% maior, sem sombra */}
            <div className="flex justify-center mb-10">
              <div className="scale-[2]">
                <Logo />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight mb-6">
              Gestão inteligente para a sua{' '}
              <span className="text-primary font-bold">igreja</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              Um sistema completo para administrar membros, ministérios,
              finanças e relatórios com organização, clareza e segurança.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/login">
                  Acessar sistema
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline">
                Conhecer recursos
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Verse */}
      <section className="py-10 bg-muted/20">
        <div className="container mx-auto px-4 max-w-xl">
          <DailyVerse />
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl lg:text-3xl font-semibold text-center mb-14">
            Tudo o que sua igreja precisa em um só lugar
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-muted/40 hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-base font-medium">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl lg:text-3xl font-semibold mb-4">
            Comece hoje mesmo
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Leve mais organização, transparência e eficiência
            para a administração da sua igreja.
          </p>
          <Button size="lg" asChild>
            <Link to="/login">
              Entrar no sistema
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
