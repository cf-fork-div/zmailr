import React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardPageHeader from '../components/DashboardPageHeader';
import ExtractRuleManager from '../components/ExtractRuleManager';

const ExtractRulesPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <DashboardPageHeader
        breadcrumb={t('dashboard.breadcrumbExtractRules')}
        title={t('dashboard.extractRulesTitle')}
        subtitle={t('dashboard.extractRulesSubtitle')}
      />
      <div className="rounded-lg border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">{t('extractRules.priorityHintTitle')}</p>
        <p>{t('extractRules.priorityHintBody')}</p>
      </div>
      <ExtractRuleManager />
    </div>
  );
};

export default ExtractRulesPage;
