import { render, screen } from '@testing-library/react';
import { NutritionPill } from '@/components/recipes/NutritionPill';

describe('NutritionPill', () => {
  it('renders nothing when no calories or protein are provided', () => {
    const { container } = render(<NutritionPill calories={null} proteinGrams={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders compact calories and protein badge', () => {
    render(<NutritionPill calories={540} proteinGrams={36} />);
    expect(screen.getByText('540')).toBeInTheDocument();
    expect(screen.getByText('36g')).toBeInTheDocument();
  });

  it('renders bar variant with carbs and fat', () => {
    render(
      <NutritionPill
        calories={620}
        proteinGrams={42}
        carbsGrams={68}
        fatGrams={18}
        variant="bar"
      />
    );
    expect(screen.getByText('620')).toBeInTheDocument();
    expect(screen.getByText('42g')).toBeInTheDocument();
    expect(screen.getByText('68g')).toBeInTheDocument();
    expect(screen.getByText('18g')).toBeInTheDocument();
  });

  it('renders detailed variant breakdown', () => {
    render(
      <NutritionPill
        calories={490}
        proteinGrams={34}
        carbsGrams={52}
        fatGrams={15}
        variant="detailed"
      />
    );
    expect(screen.getByText('490')).toBeInTheDocument();
    expect(screen.getByText('34g protein')).toBeInTheDocument();
    expect(screen.getByText('52g')).toBeInTheDocument();
    expect(screen.getByText('15g')).toBeInTheDocument();
  });
});
