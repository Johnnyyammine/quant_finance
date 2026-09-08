---
id: matrix-algebra
title: Matrix Algebra
subject: linear-algebra
summary: A matrix is a linear map, and every identity worth memorising is a fact about composing maps — the reversal rule, the quadratic form, the spectral decomposition and the two gradients that turn portfolio construction into one line of algebra.
difficulty: foundational
interview_relevance: 5
tags: [linear-algebra, matrices, quadratic-form, eigenvalues, cholesky, matrix-calculus, inverse, determinant, psd, conditioning, woodbury, ols]
prerequisites: []
related: [covariance-and-correlation, pca-and-eigenportfolios, linear-regression, variance]
aliases: [matrices, matrix identities, matrix formulas, matrix multiplication, matrix inverse, transpose, determinant, trace, quadratic form, positive semi-definite, PSD, Cholesky, spectral theorem, matrix calculus, Sherman-Morrison, Woodbury, linear algebra basics]
updated: 2026-09-07
references:
  - title: "Strang, *Introduction to Linear Algebra*, ch. 1-6"
    url: ""
  - title: "Petersen & Pedersen, *The Matrix Cookbook* (2012) — the identity reference"
    url: ""
  - title: "Golub & Van Loan, *Matrix Computations*, 4th ed. — conditioning and factorisations"
    url: ""
  - title: "Trefethen & Bau, *Numerical Linear Algebra* — why you solve rather than invert"
    url: ""
questions:
  - q: Why is $\Sigma$ required to be positive semi-definite, and what breaks if it is not?
    difficulty: foundational
    tags: [psd, risk, classic]
    hint: What does $\mathbf w^\top \Sigma \mathbf w$ mean?
    a: |
      Because $\mathbf w^\top \Sigma \mathbf w$ **is** the variance of the portfolio with weights
      $\mathbf w$, and a variance cannot be negative. PSD is not a technical nicety bolted on
      afterwards — it is the same statement as "every portfolio you can build from these assets has
      non-negative variance".

      If $\Sigma$ is not PSD there exists a $\mathbf w$ with $\mathbf w^\top\Sigma\mathbf w < 0$, and
      an optimiser will find it, because it is being asked to minimise exactly that number. The
      symptoms are recognisable: an unconstrained minimum-variance solve returns enormous offsetting
      long/short positions, reports a negative or absurdly small variance, and the "risk-free
      arbitrage" it claims to have found evaporates the moment you trade it.

      A true covariance matrix computed from a single consistent data set is always PSD. Matrices go
      non-PSD when they are **assembled** rather than measured: correlations pasted in by hand from
      different sources, blocks estimated over different windows, a matrix repaired one cell at a
      time, or expert overrides applied to a few entries. The worked example on this page shows the
      failure exactly — three individually plausible correlations that no three assets can
      simultaneously have.

      The fix is to project back onto the PSD cone: eigendecompose, floor the negative eigenvalues at
      zero (or at a small positive number), rebuild, and renormalise the diagonal back to ones if it
      is a correlation matrix. Higham's nearest-correlation-matrix algorithm does this properly.
  - q: You need $\Sigma^{-1}\mathbf 1$ for a minimum-variance portfolio. Do you call `inv`?
    difficulty: intermediate
    tags: [numerics, implementation, classic]
    a: |
      No — you call `solve`. `np.linalg.solve(Sigma, ones)` computes the same vector, and:

      - It is cheaper. Forming $\Sigma^{-1}$ costs roughly three times what one solve costs, and you
        then still have to do the matrix-vector multiply.
      - It is more accurate. The explicit inverse rounds every one of the $N^2$ entries, then the
        multiply rounds again; a solve factorises once and back-substitutes.
      - It fails loudly. A singular matrix raises `LinAlgError` from `solve`, where `inv` will
        happily return $10^{16}$-sized garbage that flows straight into your weights.

      For a covariance matrix specifically, use the Cholesky factorisation —
      `scipy.linalg.cho_factor` / `cho_solve` — which is about twice as fast again and *only*
      succeeds on a positive-definite matrix, so it doubles as a PSD check you get for free.

      The honest caveat: on a well-conditioned $3\times3$ the difference between `inv` and `solve` is
      around $10^{-16}$ and nobody will ever notice. The habit matters because the matrices that
      actually reach production are $N=500$ estimated from $T=250$ days, where the condition number
      is $10^{17}$ and the difference is the entire answer.
  - q: What is the rank of a sample covariance matrix built from $T$ observations of $N$ assets?
    difficulty: intermediate
    tags: [estimation, rank, classic, risk]
    hint: Count the independent directions the data can possibly span. Do not forget the demeaning.
    a: |
      At most $\min(N,\,T-1)$. The $-1$ is the demeaning: subtracting the sample mean costs one
      degree of freedom, so $T$ observations span a space of dimension at most $T-1$.

      So with $N = 100$ assets and $T = 100$ days you do **not** get a full-rank matrix — you get
      rank 99, a singular matrix, and an inverse that does not exist. With $T = 60$ you get rank 59:
      forty-one directions in which the data claims a portfolio has *exactly zero* risk.

      This is the single most important practical fact about covariance estimation, and it is pure
      linear algebra rather than statistics. An optimiser handed such a matrix will pour capital into
      those apparently risk-free directions. In one run of this on random data, the unconstrained
      minimum-variance solution reported an in-sample volatility of 0.2% at 1.7x gross — a number
      that is not small, it is fictional.

      The responses are all ways of restoring rank: shrinkage towards a structured target
      (Ledoit–Wolf), a factor model that replaces $N(N+1)/2$ free parameters with $N$ betas plus
      idiosyncratic variances, random-matrix filtering of the noise eigenvalues, or simply requiring
      $T \gg N$.
  - q: Multiply out $(AB)^{-1}$ and $(AB)^\top$. Why does the order reverse?
    difficulty: foundational
    tags: [identities, classic]
    a: |
      $(AB)^{-1} = B^{-1}A^{-1}$ and $(AB)^\top = B^\top A^\top$.

      The inverse case is a one-line check: $(AB)(B^{-1}A^{-1}) = A(BB^{-1})A^{-1} = AA^{-1} = I$.

      But the *reason* is worth saying out loud, because it is what makes the rule impossible to
      forget: $AB$ means "do $B$, then do $A$". To undo it you must undo the last thing first — take
      off your shoes before your socks. Every reversal identity in linear algebra is that same
      sentence.

      The trap in an interview is the follow-up: **does $(AB)^{-1} = A^{-1}B^{-1}$ ever hold?** Yes,
      exactly when $A$ and $B$ commute. So it holds for diagonal matrices, for powers of one matrix,
      and for a matrix with the identity — which is precisely why it looks true in every small
      example someone tries in their head.
  - q: Derive the gradient of $\mathbf w^\top \Sigma \mathbf w$ with respect to $\mathbf w$.
    difficulty: intermediate
    tags: [matrix-calculus, optimization, portfolio-construction]
    a: |
      $\nabla_{\mathbf w}\,\mathbf w^\top\Sigma\mathbf w = (\Sigma + \Sigma^\top)\mathbf w = 2\Sigma\mathbf w$,
      the last step using the symmetry of $\Sigma$.

      Write it in indices to be sure: $f = \sum_i\sum_j w_i \Sigma_{ij} w_j$. Differentiate with
      respect to $w_k$ — the variable appears in both slots, so you get two families of terms:

      $$\frac{\partial f}{\partial w_k} = \sum_j \Sigma_{kj}w_j + \sum_i w_i\Sigma_{ik}
        = (\Sigma\mathbf w)_k + (\Sigma^\top\mathbf w)_k$$

      **The factor of 2 is the whole point of the question.** It is the matrix version of
      $\frac{\d}{\d x}x^2 = 2x$, and dropping it is the most common slip in a whiteboard derivation
      of the efficient frontier. It cancels out of the minimum-variance weights — the Lagrange
      multiplier absorbs it — which is exactly why people get away with the error long enough to
      believe it.

      The companion identity is $\nabla_{\mathbf w}(\mathbf a^\top \mathbf w) = \mathbf a$. Those two
      are the entire toolkit for mean-variance optimisation.
  - q: $\Sigma = \beta\beta^\top\sigma_m^2 + D$ for 2,000 stocks. How do you get $\Sigma^{-1}\mathbf b$?
    difficulty: advanced
    tags: [woodbury, factor-models, numerics, performance]
    hint: You are being asked to invert a diagonal matrix plus a rank-one update.
    a: |
      Sherman–Morrison. Never form the $2000\times2000$ matrix at all:

      $$(D + \sigma_m^2\beta\beta^\top)^{-1} =
        D^{-1} - \frac{\sigma_m^2\,D^{-1}\beta\beta^\top D^{-1}}{1 + \sigma_m^2\,\beta^\top D^{-1}\beta}$$

      $D$ is diagonal, so $D^{-1}$ is $N$ divisions. Everything else is dot products. The whole solve
      is $O(N)$ instead of $O(N^3)$, and it needs $O(N)$ memory rather than $O(N^2)$.

      Measured on this exact structure: at $N = 1{,}000$ it is about 180x faster than
      `np.linalg.solve`, at $N = 4{,}000$ about 4,900x, and the two answers agree to $10^{-12}$.

      The general case is the Woodbury identity, for $K$ factors instead of one: the only matrix you
      ever invert is $K\times K$. This is why factor risk models are not merely a statistical device
      for beating the $T < N$ problem — they are also what makes the optimisation tractable at
      universe scale.

      **The follow-up:** what if $1 + \sigma_m^2\beta^\top D^{-1}\beta$ is near zero? Then $\Sigma$ is
      near-singular and the formula amplifies error — but notice that the denominator is a sum of
      positive terms whenever $D$ is a positive diagonal, so for a covariance matrix of this form it
      is safely bounded away from zero. The formula is dangerous in general and safe here, and
      knowing which is the point.
  - q: What does the determinant of a correlation matrix tell you?
    difficulty: intermediate
    tags: [determinant, psd, risk, interpretation]
    a: |
      It measures how much independent information the assets carry. $\det \mathbf P = 1$ means
      perfectly uncorrelated; $\det \mathbf P = 0$ means at least one asset is an exact linear
      combination of the others; and $\det \mathbf P < 0$ for a symmetric unit-diagonal matrix means
      the numbers you were given are **not correlations at all**, because no set of random variables
      can produce them.

      Geometrically the determinant is the squared volume of the parallelepiped spanned by the
      standardised return vectors. Redundant assets flatten that solid towards zero volume.

      For three assets there is a closed form worth remembering:

      $$\det \mathbf P = 1 + 2\rho_{12}\rho_{13}\rho_{23} - \rho_{12}^2 - \rho_{13}^2 - \rho_{23}^2$$

      Set it to zero and you get the exact boundary of the admissible region. With
      $\rho_{13} = -0.2$ and $\rho_{23} = 0.1$ fixed, $\rho_{12}$ can be no larger than
      $0.9549$ — the worked example on this page walks through what happens at $0.99$.
  - q: Give a $2\times2$ example where $AB \ne BA$, then say when matrices do commute.
    difficulty: foundational
    tags: [identities, classic]
    a: |
      The smallest honest pair is the two elementary shears:

      $$A=\begin{pmatrix}1&1\\0&1\end{pmatrix},\quad B=\begin{pmatrix}1&0\\1&1\end{pmatrix},\quad
        AB=\begin{pmatrix}2&1\\1&1\end{pmatrix},\quad BA=\begin{pmatrix}1&1\\1&2\end{pmatrix}$$

      Composition of maps is order-dependent in the same way rotating then translating differs from
      translating then rotating.

      Matrices commute when they share a common eigenbasis — which covers the cases that come up in
      practice: diagonal matrices, powers and polynomials of a single matrix, a matrix with the
      identity or with any scalar multiple of it, and two symmetric matrices that are simultaneously
      diagonalisable.

      Where it bites: $\operatorname{diag}(\boldsymbol\sigma)\mathbf P\operatorname{diag}(\boldsymbol\sigma)$
      is the covariance matrix, and you cannot collect the two diagonal factors into
      $\operatorname{diag}(\boldsymbol\sigma)^2 \mathbf P$. One scales the rows, the other scales the
      columns, and $\Sigma_{ij} = \sigma_i\rho_{ij}\sigma_j$ needs both.
---

## Intuition

A matrix is not a grid of numbers. It is a **linear map** — a rule that takes a vector and returns a
vector, subject to one condition: it must respect addition and scaling. Once you hold that picture,
every identity worth memorising stops being a formula and becomes an obvious fact about composing
functions.

- **Multiplication is composition.** $AB$ means "apply $B$, then apply $A$", which is why it reads
  right to left and why it does not commute.
- **The inverse is undoing.** It exists only when the map loses nothing, which is the same as saying
  no direction gets flattened to zero.
- **The determinant is the volume scale factor.** Zero determinant means the map squashed space into
  a lower dimension, which is exactly when the inverse fails to exist.
- **Eigenvectors are the directions the map leaves alone** apart from stretching, and eigenvalues are
  how much stretch.

In quant work you meet essentially three matrices, and it is worth knowing which one you are holding:

| What it is | Shape | Key property |
|---|---|---|
| A **covariance matrix** $\Sigma$ | $N \times N$ | symmetric, positive semi-definite |
| A **design matrix** $X$ of data | $T \times k$ | tall and thin; $T$ observations, $k$ features |
| A **transformation of weights** | whatever composes | usually not symmetric |

:::insight
Almost every matrix in finance is symmetric positive semi-definite, and that is a much stronger
condition than it looks. It buys you real eigenvalues, an orthonormal eigenbasis, a Cholesky
factorisation, and a guarantee that quadratic forms are non-negative. When an algorithm has a
special case for symmetric matrices — `eigh` over `eig`, Cholesky over LU — the special case is the
one you want, and it is faster.
:::

## Mathematical Formulation

The product, and the shape rule that governs everything:

:::formula {name="Matrix product" used-in="Everywhere" note="Inner dimensions must agree; the outer dimensions survive."}
(AB)_{ij} = \sum_{k=1}^{n} A_{ik}B_{kj}, \qquad
\underbrace{A}_{m \times n}\underbrace{B}_{n \times p} = \underbrace{AB}_{m \times p}
:::

The reversal rules. These are the identities that come up on a whiteboard more than any others:

:::formula {name="Reversal rules" used-in="Derivations, Hedging, Regression"}
(AB)^\top = B^\top A^\top, \qquad (AB)^{-1} = B^{-1}A^{-1}, \qquad (A^\top)^{-1} = (A^{-1})^\top
:::

The quadratic form — one line of algebra that carries the whole of portfolio risk:

:::formula {name="Quadratic form and portfolio variance" used-in="Risk Management, Portfolio Construction" note="Positive semi-definiteness is the statement that no portfolio has negative variance."}
\sigma_p^2 = \mathbf w^\top \Sigma\, \mathbf w = \sum_i \sum_j w_i \Sigma_{ij} w_j
\;\ge\; 0 \quad \text{for all } \mathbf w \iff \Sigma \succeq 0
:::

The $2\times2$ inverse, because you will be asked to do one without a computer:

:::formula {name="Inverse and determinant of a 2x2" used-in="Mental Math, Interviews"}
\begin{pmatrix} a & b \\ c & d \end{pmatrix}^{-1}
= \frac{1}{ad-bc}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix},
\qquad \det = ad - bc
:::

Trace and determinant tie back to the eigenvalues, which makes both of them cheap sanity checks:

:::formula {name="Trace and determinant from the spectrum" used-in="Diagnostics, PCA"}
\operatorname{tr}(A) = \sum_i A_{ii} = \sum_i \lambda_i, \qquad
\det(A) = \prod_i \lambda_i, \qquad \operatorname{tr}(AB) = \operatorname{tr}(BA)
:::

For symmetric matrices the spectral theorem is the structural result everything else leans on:

:::formula {name="Spectral decomposition" used-in="PCA, Risk Models, Simulation" note="Q is orthogonal, so its inverse is its transpose — the cheapest inverse there is."}
\Sigma = Q\Lambda Q^\top, \qquad Q^\top Q = I, \qquad
\Lambda = \operatorname{diag}(\lambda_1,\dots,\lambda_N)
:::

The Cholesky factorisation — the square root you use to simulate correlated returns:

:::formula {name="Cholesky factorisation" used-in="Monte Carlo, Simulation, Risk" note="Exists and is unique exactly when the matrix is positive definite, so it doubles as a PSD test."}
\Sigma = LL^\top, \qquad
\mathbf r = L\mathbf z \;\text{ with }\; \mathbf z \sim N(0, I)
\;\Longrightarrow\; \Cov(\mathbf r) = \Sigma
:::

Least squares in matrix form — one expression that contains all of regression:

:::formula {name="Normal equations" used-in="Regression, Factor Models, Hedging"}
\hat{\boldsymbol\beta} = (X^\top X)^{-1}X^\top \mathbf y, \qquad
X \in \R^{T\times k},\; X^\top X \in \R^{k\times k}
:::

Sherman–Morrison, for a diagonal matrix plus a rank-one update — which is what a one-factor risk
model is:

:::formula {name="Sherman-Morrison" used-in="Factor Models, Kalman Filters, Fast Optimisation"}
(D + \sigma^2\mathbf u\mathbf u^\top)^{-1}
= D^{-1} - \frac{\sigma^2\,D^{-1}\mathbf u\mathbf u^\top D^{-1}}{1 + \sigma^2\,\mathbf u^\top D^{-1}\mathbf u}
:::

And the two gradients that turn mean-variance optimisation into a one-line solve:

:::formula {name="The two gradients you need" used-in="Optimization, Portfolio Construction" note="The 2 comes from w appearing in both slots of the quadratic form. It is the matrix version of d(x^2)/dx = 2x."}
\frac{\partial}{\partial \mathbf w}\big(\mathbf a^\top\mathbf w\big) = \mathbf a,
\qquad
\frac{\partial}{\partial \mathbf w}\big(\mathbf w^\top\Sigma\mathbf w\big) = 2\Sigma\mathbf w
:::

## Derivation

:::derivation Why the order reverses
Take the transpose first, in indices. By definition $(M^\top)_{ij} = M_{ji}$, so

$$\big((AB)^\top\big)_{ij} = (AB)_{ji} = \sum_k A_{jk}B_{ki}
 = \sum_k (B^\top)_{ik}(A^\top)_{kj} = (B^\top A^\top)_{ij}$$

The sum over $k$ never moved; all that happened is that the two factors had to swap places for the
inner indices to meet.

The inverse is even shorter — you simply check the candidate:

$$(AB)(B^{-1}A^{-1}) = A(BB^{-1})A^{-1} = AIA^{-1} = I$$

and inverses are unique, so $B^{-1}A^{-1}$ *is* $(AB)^{-1}$.

The reason to remember, rather than the proof: $AB$ does $B$ first. Undoing a sequence means undoing
the last step first. Shoes and socks.
:::

:::derivation The quadratic-form gradient, and the minimum-variance portfolio
Write the quadratic form out and differentiate with respect to one component:

$$f(\mathbf w) = \sum_i\sum_j w_i\Sigma_{ij}w_j,
\qquad
\frac{\partial f}{\partial w_k} = \underbrace{\sum_j \Sigma_{kj}w_j}_{i=k \text{ terms}}
 + \underbrace{\sum_i w_i\Sigma_{ik}}_{j=k \text{ terms}}$$

$\mathbf w$ appears in both slots, so each contributes once. Stacking the components gives
$(\Sigma + \Sigma^\top)\mathbf w$, and symmetry collapses it to $2\Sigma\mathbf w$.

Now put it to work. Minimise variance subject to the weights summing to one:

$$\mathcal L = \mathbf w^\top\Sigma\mathbf w - \gamma(\1^\top\mathbf w - 1),
\qquad
\nabla_{\mathbf w}\mathcal L = 2\Sigma\mathbf w - \gamma\1 = 0$$

So $\mathbf w = \tfrac{\gamma}{2}\Sigma^{-1}\1$. The constraint fixes the scale — the whole vector
must sum to one — which gives

$$\boxed{\;\mathbf w_{\text{mv}} = \frac{\Sigma^{-1}\1}{\1^\top\Sigma^{-1}\1}\;}
\qquad\text{and}\qquad
\sigma_{\text{mv}}^2 = \frac{1}{\1^\top\Sigma^{-1}\1}$$

Notice that the factor of 2 vanished into $\gamma$. That is why dropping it early is a mistake you
can make and still get the right weights — right up until you need the multiplier itself, which in
the mean-variance problem is the risk-aversion parameter.

One more line, and a result worth carrying: $\Sigma\mathbf w_{\text{mv}} = \sigma^2_{\text{mv}}\1$,
a constant vector. Every asset has the same marginal contribution to risk at the minimum. That is
the defining property of the minimum-variance portfolio, and it is why an asset can hold a large
weight there without being a large share of the risk.
:::

:::derivation Sherman-Morrison, by checking rather than by guessing
The honest derivation of a rank-one inverse update is to multiply the claim out. Write
$\Sigma = D + \sigma^2\mathbf u\mathbf u^\top$ and let $\alpha = 1 + \sigma^2\mathbf u^\top D^{-1}\mathbf u$,
a scalar. The claim is that the inverse is
$D^{-1} - \sigma^2 D^{-1}\mathbf u\mathbf u^\top D^{-1}/\alpha$. Multiply:

$$(D + \sigma^2\mathbf u\mathbf u^\top)\left(D^{-1} - \frac{\sigma^2 D^{-1}\mathbf u\mathbf u^\top D^{-1}}{\alpha}\right)$$

$$= I - \frac{\sigma^2\mathbf u\mathbf u^\top D^{-1}}{\alpha}
  + \sigma^2\mathbf u\mathbf u^\top D^{-1}
  - \frac{\sigma^4\,\mathbf u\,(\mathbf u^\top D^{-1}\mathbf u)\,\mathbf u^\top D^{-1}}{\alpha}$$

The middle term of the bracket, $\mathbf u^\top D^{-1}\mathbf u$, is a **scalar**, so it slides out
of the product. Collect the three terms that carry $\mathbf u\mathbf u^\top D^{-1}$:

$$\sigma^2\mathbf u\mathbf u^\top D^{-1}\left(1 - \frac{1}{\alpha} - \frac{\sigma^2\mathbf u^\top D^{-1}\mathbf u}{\alpha}\right)
= \sigma^2\mathbf u\mathbf u^\top D^{-1}\cdot\frac{\alpha - 1 - \sigma^2\mathbf u^\top D^{-1}\mathbf u}{\alpha} = 0$$

by the definition of $\alpha$. What remains is $I$.

The general statement is the Woodbury identity: for $K$ factors, $\Sigma = D + B\Omega B^\top$ with
$B \in \R^{N\times K}$, the only matrix you ever invert is $K\times K$. A 2,000-name universe with
ten factors needs one $10\times10$ inverse.
:::

## Assumptions & Edge Cases

:::assumption
- **Shapes before anything else.** $AB$ requires $A$'s columns to match $B$'s rows. Most "the maths
  is wrong" bugs are a transpose in the wrong place, and the shapes would have caught them.
- **Non-commutativity is the default.** $AB \ne BA$ unless the two share an eigenbasis. Diagonal
  matrices commute with each other, which is why intuition built on scalars survives longer than it
  should.
- **Invertibility is not typical.** A square matrix is invertible only when no direction is
  flattened — equivalently $\det \ne 0$, all eigenvalues non-zero, full rank. A sample covariance
  from $T \le N$ observations fails this **always**, not occasionally.
- **PSD is not the same as PD.** Positive *semi*-definite allows zero eigenvalues, so $\Sigma$ can be
  a genuine covariance matrix and still have no inverse. Cholesky needs strictly positive definite.
- **Near-singular is worse than singular**, because it does not raise. The condition number
  $\kappa = \lambda_{\max}/\lambda_{\min}$ tells you roughly how many digits you lose: at
  $\kappa = 10^{12}$, double precision has about four left.
:::

:::pitfall
A correlation matrix is not just any symmetric matrix with ones on the diagonal — it must also be
PSD, and that constraint couples the entries. Three correlations that are each perfectly reasonable
in isolation can be jointly impossible. Overriding one cell of an estimated matrix "because we know
these two are more correlated than that" is the standard way to produce a matrix that no data could
have generated.
:::

## Worked Example

Three assets — call them Equity, Credit and Rates — with annualised volatilities
$\boldsymbol\sigma = (20\%,\,15\%,\,10\%)$ and correlations $\rho_{12}=0.60$, $\rho_{13}=-0.20$,
$\rho_{23}=0.10$.

**Build $\Sigma$.** The construction is $\Sigma = \operatorname{diag}(\boldsymbol\sigma)\,\mathbf P\,\operatorname{diag}(\boldsymbol\sigma)$,
which is exactly $\Sigma_{ij} = \sigma_i\rho_{ij}\sigma_j$:

| $\Sigma$ | Equity | Credit | Rates |
|---|---|---|---|
| **Equity** | 0.0400 | 0.0180 | −0.0040 |
| **Credit** | 0.0180 | 0.0225 | 0.0015 |
| **Rates** | −0.0040 | 0.0015 | 0.0100 |

**The quadratic form does the diversification.** Equal weights, $\mathbf w = (\tfrac13,\tfrac13,\tfrac13)$:

$$\sigma_p^2 = \mathbf w^\top\Sigma\mathbf w = \frac{1}{9}\sum_{i,j}\Sigma_{ij} = \frac{0.1035}{9} = 0.0115
\;\Longrightarrow\; \sigma_p = 10.72\%$$

against a weighted-average volatility of $15.00\%$. The whole of the diversification benefit is the
off-diagonal terms of one quadratic form.

**Minimum variance.** Solving $\Sigma\mathbf w \propto \1$ and normalising:

$$\mathbf w_{\text{mv}} = (19.69\%,\; 8.45\%,\; 71.85\%), \qquad
\sigma_{\text{mv}} = 8.08\%$$

Check the property from the derivation: $\Sigma\mathbf w_{\text{mv}} = (0.006524,\,0.006524,\,0.006524)$
— constant, as promised, and equal to $\sigma^2_{\text{mv}}$. Rates takes 72% of the capital but,
because marginal risk is equalised, exactly 72% of the risk too.

**The spectrum.** Eigenvalues $\lambda = (0.051428,\; 0.013994,\; 0.007078)$:

| Check | Value | Against |
|---|---|---|
| $\sum\lambda_i$ | 0.072500 | $\operatorname{tr}\Sigma = 0.04+0.0225+0.01 = 0.0725$ |
| $\prod\lambda_i$ | $5.094\times10^{-6}$ | $\det\Sigma = 5.094\times10^{-6}$ |
| $\lambda_{\max}/\lambda_{\min}$ | 7.27 | condition number — comfortably small |

The variance shares are 70.9%, 19.3% and 9.8%, which is where [[pca-and-eigenportfolios]] starts.

**The square root.** The Cholesky factor comes out unusually clean, so you can check it by hand:

$$L = \begin{pmatrix} 0.20 & 0 & 0 \\ 0.09 & 0.12 & 0 \\ -0.02 & 0.0275 & 0.094041 \end{pmatrix},
\qquad LL^\top = \Sigma$$

Read the first column: it is the first row of $\Sigma$ divided by $\sigma_1$. Read $L_{33}$: it is
$\sqrt{0.01 - (-0.02)^2 - 0.0275^2} = 0.094041$, the volatility of Rates *after* removing everything
the first two assets explain. Every Cholesky entry is a residual volatility, which is why
$\mathbf r = L\mathbf z$ produces correlated returns from independent shocks.

**Now break it.** Suppose a portfolio manager insists Equity and Credit are more correlated than the
data says, and overrides $\rho_{12} = 0.60 \to 0.99$, leaving the others alone. For a $3\times3$
correlation matrix,

$$\det\mathbf P = 1 + 2\rho_{12}\rho_{13}\rho_{23} - \rho_{12}^2 - \rho_{13}^2 - \rho_{23}^2
= 0.95 - 0.04\,\rho_{12} - \rho_{12}^2$$

At $\rho_{12} = 0.60$ that is $+0.566$. At $\rho_{12}=0.99$ it is $-0.0697$ — **negative**, so the
matrix is not PSD and the smallest eigenvalue is $-0.0336$. There is a portfolio with negative
variance in there, and an optimiser will find it.

Setting the determinant to zero gives the exact boundary: with the other two correlations fixed,
$\rho_{12}$ can be at most

$$\rho_{12}^\star = \frac{-0.04+\sqrt{0.04^2+4(0.95)}}{2} = 0.9549$$

Not 1. The other two correlations have already spent some of the budget. This is the single most
useful thing the determinant does for you in practice.

## Why It Matters in Quant Finance

Matrix algebra is the notation quant finance is written in, and the reason is compression: the
quadratic form $\mathbf w^\top\Sigma\mathbf w$ is a sum over $N^2$ pairs, and for a 500-name book
that is 125,250 covariance terms standing behind five characters.

But the deeper reason is that **the structure of the matrix is the structure of the problem**. When
$\Sigma$ is near-singular, that is not a numerical annoyance — it is the data telling you two of your
assets are the same trade. When an eigenvalue is tiny, there is a portfolio the model believes is
almost riskless, and the model is usually wrong. When the determinant is negative, someone has
supplied correlations that no world can produce. Every one of those is a modelling insight arriving
disguised as a linear-algebra fact.

## Trading & Research Application

- **Risk decomposition.** Marginal contribution to risk is $\partial\sigma_p/\partial\mathbf w = \Sigma\mathbf w/\sigma_p$
  — the quadratic-form gradient divided by volatility. Every risk report you have ever read is that
  vector.
- **Hedging.** The minimum-variance hedge ratio is the OLS solution
  $\hat{\boldsymbol\beta} = (X^\top X)^{-1}X^\top\mathbf y$, whether $X$ is one futures contract or
  forty tenor buckets. See [[linear-regression]].
- **Factor models.** $\Sigma = B\Omega B^\top + D$ replaces $N(N+1)/2$ free parameters with $NK + K(K+1)/2 + N$,
  which is what makes the matrix both estimable and invertible. Woodbury then makes it fast.
- **Simulation.** Correlated scenarios are $L\mathbf z$ with $L$ the Cholesky factor, which is how
  every Monte Carlo VaR engine generates its paths.
- **Portfolio construction.** Mean-variance, risk parity and Black–Litterman are all a solve against
  $\Sigma$ with different right-hand sides. See [[effective-number-of-bets]] for what the eigenvalues
  say about whether the diversification is real.

## Implementation Notes

```python
import numpy as np
from scipy.linalg import cho_factor, cho_solve


def min_variance_weights(cov):
    """Long/short minimum-variance weights.

    Cholesky rather than `inv`: about twice the speed of a general solve, and it
    raises on a non-positive-definite matrix instead of returning weights built
    from a negative variance. That failure is the useful part -- a covariance
    matrix that will not factorise is telling you something about your data.
    """
    cov = np.asarray(cov, dtype=float)
    n = cov.shape[0]
    if not np.allclose(cov, cov.T, atol=1e-12):
        raise ValueError("covariance matrix is not symmetric")

    c, low = cho_factor(cov)                 # raises LinAlgError if not PD
    z = cho_solve((c, low), np.ones(n))      # never form the inverse
    return z / z.sum()


def is_psd(matrix, tol=1e-10):
    """Report the smallest eigenvalue alongside the verdict.

    `eigvalsh` rather than `eigvals`: the symmetric routine returns sorted real
    eigenvalues, is about twice as fast, and does not hand back complex dtypes
    with 1e-17 imaginary parts that then have to be explained to someone.
    """
    smallest = float(np.linalg.eigvalsh(matrix).min())
    return smallest >= -tol, smallest
```

Beyond that:

- **`solve`, never `inv`.** Roughly a third of the cost and better conditioned. If you catch yourself
  writing `inv(A) @ b`, write `solve(A, b)`.
- **`eigh`, never `eig`, on anything symmetric.** Sorted real eigenvalues, orthogonal eigenvectors to
  machine precision, about twice the speed.
- **Check the condition number before trusting a solve.** `np.linalg.cond` is cheap next to the
  consequences; above $10^{10}$ on a covariance matrix, treat the answer as decoration.
- **Rank is capped at $\min(N, T-1)$.** Measured on random data: $N=100$ from $T=100$ days gives rank
  99, not 100 — the demeaning costs the last one. $N=100$ from $T=60$ gives rank 59.
- **Watch the memory layout at scale.** NumPy is row-major; BLAS underneath is column-major. For
  $N$ in the thousands, `A @ B` on the wrong layout can cost several times what it needs to.

## Common Mistakes

- **Reversing a product without reversing the order.** $(AB)^\top = B^\top A^\top$, not
  $A^\top B^\top$ — which is usually not even a legal shape, so the error announces itself. The
  inverse case is more dangerous because square matrices make the illegal version legal.
- **Losing the factor of 2** in $\nabla(\mathbf w^\top\Sigma\mathbf w) = 2\Sigma\mathbf w$. It
  cancels in the minimum-variance weights, so the mistake survives until it reaches the risk-aversion
  parameter and silently doubles it.
- **Collapsing $\operatorname{diag}(\boldsymbol\sigma)\mathbf P\operatorname{diag}(\boldsymbol\sigma)$
  to $\operatorname{diag}(\boldsymbol\sigma)^2\mathbf P$.** The left factor scales rows, the right
  scales columns. Only the two together give $\sigma_i\rho_{ij}\sigma_j$.
- **Calling `inv` on a sample covariance with $T \lesssim N$.** It is singular by construction. You
  will get an answer, it will be enormous, and it will be noise.
- **Treating a correlation matrix as freely editable.** Overriding one cell breaks PSD. Repair the
  whole matrix — eigendecompose, floor the eigenvalues, rebuild — or do not touch it.
- **Reading a small determinant as "nearly singular" without scaling.** Determinants scale as the
  $N$-th power, so $\det\Sigma = 5\times10^{-6}$ above sounds alarming and is perfectly healthy. The
  condition number, 7.27, is the number that actually answers the question.

## 30-Second Revision

- A matrix is a linear map. $AB$ means "$B$ then $A$" — hence $(AB)^{-1}=B^{-1}A^{-1}$ and
  $(AB)^\top = B^\top A^\top$.
- $\sigma_p^2 = \mathbf w^\top\Sigma\mathbf w \ge 0$ for every $\mathbf w$ **is** the definition of
  PSD. It is a statement about portfolios, not a technicality.
- $\nabla(\mathbf a^\top\mathbf w) = \mathbf a$ and $\nabla(\mathbf w^\top\Sigma\mathbf w) = 2\Sigma\mathbf w$.
  Those two give $\mathbf w_{\text{mv}} = \Sigma^{-1}\1/(\1^\top\Sigma^{-1}\1)$ in three lines.
- $\operatorname{tr} = \sum\lambda_i$, $\det = \prod\lambda_i$. Both are free sanity checks on an
  eigendecomposition.
- Symmetric $\Rightarrow$ $\Sigma = Q\Lambda Q^\top$ with $Q^\top Q = I$; positive definite
  $\Rightarrow$ $\Sigma = LL^\top$, and $L\mathbf z$ simulates correlated returns.
- Rank of a sample covariance $\le \min(N, T-1)$. $T \le N$ means singular, always.
- `solve` not `inv`; `eigh` not `eig`; check $\kappa = \lambda_{\max}/\lambda_{\min}$ before you trust
  anything.
- Diagonal plus rank one inverts in $O(N)$ by Sherman–Morrison — measured at ~180x faster than a
  general solve at $N=1{,}000$, ~4{,}900x at $N=4{,}000$.
